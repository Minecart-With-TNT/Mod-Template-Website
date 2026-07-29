import { onMount, createMemo, Index, Show, Switch, Match } from 'solid-js';
import Card from '../Card';
import {
  type Line as FormLine,
  type Loader,
  getFormLines,
} from '../../core';
import type { DocId } from '../../docs';
import styles from './common.module.css';
import { Line } from './Line';
import { TextValue } from './TextValue';
import { ChipSelection } from './ChipSelection';
import { BoolValue } from './BoolValue';
import { PromiseValue } from './PromiseValue';
import { SubmitValue } from './SubmitValue';
import { setCurrentDoc, getForm, updateForm } from '../../store';

function FormLineView(props: { line: FormLine, index: number }) {
  return (
    <>
      <Show when={props.index > 0 && props.line.type === 'section-header'}>
        {/* Empty line between sections */}
        <Line />
      </Show>
      <Switch>
        <Match when={props.line.type === 'section-header' ? props.line : false}>
          {line => <Line comment={line().name} />}
        </Match>
        <Match when={props.line.type === 'text' ? props.line : false}>
          {line => (
            <Line key={line().key}>
              <TextValue
                value={line().value}
                setValue={v => line().setValue(v)}
                onFocus={() => setCurrentDoc(line().key as DocId)}
                options={line().options}
                flags={line().flagNames}
                placeholder={line().placeholder}
              />
            </Line>
          )}
        </Match>
        <Match when={props.line.type === 'select' ? props.line : false}>
          {line => (
            <Line key={line().key}>
              <ChipSelection
                value={line().value as Loader}
                options={line().options}
                onChange={l => {
                  line().setValue(l);
                  setCurrentDoc(`${line().key}_${l}` as DocId);
                }}
                onFocus={() => setCurrentDoc(`${line().key}_${line().value}` as DocId)}
              />
            </Line>
          )}
        </Match>
        <Match when={props.line.type === 'value' ? props.line : false}>
          {line => (
            <Line key={line().key}>
              <PromiseValue value={line().value} />
            </Line>
          )}
        </Match>
        <Match when={props.line.type === 'bool' ? props.line : false}>
          {line => (
            <Line key={line().key}>
              <BoolValue
                value={line().value}
                onChange={v => line().setValue(v)}
                onFocus={() => setCurrentDoc(line().key as DocId)}
              />
            </Line>
          )}
        </Match>
      </Switch>
    </>
  );
}

export default function GradleEditor(props: {
  onSubmit?: () => void,
}) {
  let formEl!: HTMLFormElement;

  const lines = createMemo(() => getFormLines(getForm(), updateForm));

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
        <Index each={lines()}>
          {(line, i) => <FormLineView line={line()} index={i} />}
        </Index>
        <Line />
        <Line><SubmitValue /></Line>
      </form>
    </Card>
  );
}
