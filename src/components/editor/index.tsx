import { onMount, createResource, Show } from 'solid-js';
import Card from '../Card';
import { type Loader, needsFabric, needsNeoForge, needsForge, getMinecraftVersions, getLicenses } from '../../core';
import styles from './common.module.css';
import { Line } from './Line';
import { ValuePicker } from './ValuePicker';
import { EditValue } from './EditValue';
import { ChipSelection, type ChipOption } from './ChipSelection';
import { BoolValue } from './BoolValue';
import { ResourceValue } from './ResourceValue';
import { SubmitValue } from './SubmitValue';
import { setCurrentDoc, getForm, getDefaults, updateForm, fabricLoaderVersion, fabricApiVersion, neoforgeVersion, forgeVersion } from '../../store';

const LOADERS: ChipOption<Loader>[] = [
  { id: 'fabric',       label: 'Fabric'      },
  { id: 'neoforge',    label: 'NeoForge'    },
  { id: 'multiloader', label: 'Multiloader' },
];

export default function GradleEditor(props: {
  onSubmit?: () => void,
}) {
  const [mcVersions] = createResource(getMinecraftVersions);
  const [licenses] = createResource(getLicenses);

  let formEl!: HTMLFormElement;

  onMount(() => {
    formEl.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
  });

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    props.onSubmit?.();
  }

  function getNavItems(form: HTMLFormElement): HTMLElement[] {
    return Array.from(form.querySelectorAll<HTMLElement>(
      'input[type="text"], [data-chip-option][data-active], [data-generate-btn]'
    ));
  }

  function navIndex(form: HTMLFormElement, target: HTMLElement, isChip: boolean): number {
    const navItems = getNavItems(form);
    const direct = navItems.indexOf(target);
    if (direct >= 0) return direct;
    if (!isChip) return -1;
    const active = target.closest('[data-chip-selection]')
      ?.querySelector<HTMLElement>('[data-chip-option][data-active]');
    return active ? navItems.indexOf(active) : -1;
  }

  function focusEl(el: HTMLElement, atEnd: boolean) {
    el.focus();
    if (el instanceof HTMLInputElement) {
      const pos = atEnd ? el.value.length : 0;
      el.setSelectionRange(pos, pos);
    }
  }

  function handleEditorKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const isInput = target instanceof HTMLInputElement && target.type === 'text';
    const isChip = 'chipOption' in target.dataset;
    const isGenerate = 'generateBtn' in target.dataset;
    if (!isInput && !isChip && !isGenerate) return;

    const form = e.currentTarget as HTMLFormElement;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const goDown = e.key === 'ArrowDown';
      const navItems = getNavItems(form);
      const next = navItems[navIndex(form, target, isChip) + (goDown ? 1 : -1)];
      if (next) { e.preventDefault(); focusEl(next, !goDown); }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const goRight = e.key === 'ArrowRight';
      if (isChip) {
        const group = target.closest('[data-chip-selection]');
        if (!group) return;
        const chips = Array.from(group.querySelectorAll<HTMLElement>('[data-chip-option]'));
        const next = chips[chips.indexOf(target) + (goRight ? 1 : -1)];
        if (next) { e.preventDefault(); next.click(); next.focus(); }
      } else if (isInput) {
        const input = target as HTMLInputElement;
        const len = input.value.length;
        const atEdge = goRight
          ? input.selectionStart === len && input.selectionEnd === len
          : input.selectionStart === 0 && input.selectionEnd === 0;
        if (atEdge) {
          const navItems = getNavItems(form);
          const next = navItems[navItems.indexOf(input) + (goRight ? 1 : -1)];
          if (next) { e.preventDefault(); focusEl(next, !goRight); }
        }
      }
    } else if (e.key === 'Enter') {
      if (isInput || isChip) {
        e.preventDefault();
        const navItems = getNavItems(form);
        const next = navItems[navIndex(form, target, isChip) + 1];
        if (next) focusEl(next, false);
      }
      // isGenerate: let browser submit normally
    }
  }

  function handleEditorFocus(e: FocusEvent) {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement) || target.type !== 'text') return;
    const input = target;
    requestAnimationFrame(() => {
      if (input.selectionStart === 0 && input.selectionEnd === input.value.length && input.value.length > 0) {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  }

  return (
    <Card title="gradle.properties">
      <form
        ref={formEl}
        class={styles.body}
        onSubmit={handleSubmit}
        onKeyDown={handleEditorKeyDown}
        onFocus={handleEditorFocus}
      >
        <Line comment="Mod Properties" />
        <Line key="mod_name"><EditValue formKey="modName" docId="mod_name" /></Line>
        <Line key="mod_id"><EditValue formKey="modId" docId="mod_id" valueFixer={v => v.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64)} /></Line>
        <Line key="mod_version"><EditValue formKey="modVersion" docId="mod_version" /></Line>
        <Line key="mod_authors"><EditValue formKey="authors" docId="mod_authors" /></Line>
        <Line key="maven_group"><EditValue formKey="projectPackage" docId="maven_group" /></Line>
        <Line key="license">
          <ValuePicker
            value={getForm().license}
            setValue={v => updateForm('license', v)}
            onFocus={() => setCurrentDoc('license')}
            items={licenses}
            placeholder="none"
          />
        </Line>
        <Line />
        <Line comment="Dependencies" />
        <Line key="minecraft_version">
          <ValuePicker
            value={getForm().mcVersion}
            setValue={v => updateForm('mcVersion', v)}
            onFocus={() => setCurrentDoc('minecraft_version')}
            items={mcVersions}
            flags={['Releases', 'Snapshots']}
            placeholder={getDefaults().mcVersion}
          />
        </Line>
        <Line key="mod_loader">
          <ChipSelection
            value={getForm().loader}
            options={LOADERS}
            onChange={l => { updateForm('loader', l); setCurrentDoc(`loader_${l}`); }}
            onFocus={() => setCurrentDoc(`loader_${getForm().loader}`)}
          />
        </Line>
        <Show when={needsFabric(getDefaults())}>
          <Line key="fabric_loader_version"><ResourceValue resource={fabricLoaderVersion} /></Line>
          <Line key="fabric_api_version"><ResourceValue resource={fabricApiVersion} /></Line>
        </Show>
        <Show when={needsNeoForge(getDefaults())}>
          <Line key="neoforge_version"><ResourceValue resource={neoforgeVersion} /></Line>
        </Show>
        <Show when={needsForge(getDefaults())}>
          <Line key="forge_version"><ResourceValue resource={forgeVersion} /></Line>
        </Show>
        <Line />
        <Line comment="Template Options" />
        <Line key="separate_client">
          <BoolValue
            value={getForm().separateClient}
            onChange={v => updateForm('separateClient', v)}
            onFocus={() => setCurrentDoc('separate_client')}
          />
        </Line>
        <Line key="use_mixin">
          <BoolValue
            value={getForm().useMixin}
            onChange={v => updateForm('useMixin', v)}
            onFocus={() => setCurrentDoc('use_mixin')}
          />
        </Line>
        <Line />
        <Line><SubmitValue /></Line>
      </form>
    </Card>
  );
}
