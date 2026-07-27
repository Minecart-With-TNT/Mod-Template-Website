import { onMount, createResource, For, Show, type Resource } from 'solid-js'
import Card from './Card'
import { type FormState, type Loader, needsFabric, needsNeoForge, needsForge, getMinecraftVersions } from '../core'
import styles from './GradleEditor.module.css'
import { Chip } from './Chip'
import { Line } from './Line'
import { ValuePicker } from './ValuePicker'
import { setCurrentDoc, getForm, getDefaults, updateForm, fabricLoaderVersion, fabricApiVersion, neoforgeVersion, forgeVersion } from '../store'
import type { DocId } from '../docs'

const LOADERS: { id: Loader; label: string }[] = [
  { id: 'fabric',       label: 'Fabric'      },
  { id: 'neoforge',    label: 'NeoForge'    },
  { id: 'multiloader', label: 'Multiloader' },
]

function ResourceValue(props: { resource: Resource<string | null> }) {
  return <>{
    props.resource.loading
    ? <span class={styles.placeholder}>loading...</span>
    : props.resource()
      ? <span class={styles.val}>{props.resource()!}</span>
      : <span class={styles.placeholder}>unavailable</span>
  }</>
}

type StringFormKey = Exclude<keyof FormState, 'loader'>

function EditValue(props: {
  formKey: StringFormKey
  docId: DocId
  valueFixer?: (v: string) => string
}) {
  return (
    <span class={styles.editCell}>
      <input
        type="text"
        class={styles.inlineInput}
        value={getForm()[props.formKey]}
        placeholder={getDefaults()[props.formKey]}
        onInput={e => {
          const v = e.currentTarget.value;
          updateForm(props.formKey, props.valueFixer ? props.valueFixer(v) : v);
        }}
        onFocus={() => setCurrentDoc(props.docId)}
        autocomplete="off"
        spellcheck={false}
      />
    </span>
  )
}

function LoaderValue(props: { value: Loader; onChange: (l: Loader) => void; onFocus?: () => void }) {
  return (
    <span class={styles.chipGroup}>
      <For each={LOADERS}>
        {l => (
          <Chip
            data-loader-chip
            data-active={props.value === l.id ? '' : undefined}
            active={props.value === l.id}
            onClick={() => props.onChange(l.id)}
            onFocus={props.onFocus}
          >
            {l.label}
          </Chip>
        )}
      </For>
    </span>
  )
}

function SubmitValue() {
  return (
    <Chip type="submit" active data-generate-btn>
      generate_template
    </Chip>
  )
}

export default function GradleEditor(props: {
  onSubmit?: () => void
}) {
  const [mcVersions] = createResource(getMinecraftVersions)

  let formEl!: HTMLFormElement

  onMount(() => {
    formEl.querySelector<HTMLInputElement>('input[type="text"]')?.focus()
  })

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    props.onSubmit?.()
  }

  function getNavItems(form: HTMLFormElement): HTMLElement[] {
    return Array.from(form.querySelectorAll<HTMLElement>(
      'input[type="text"], [data-loader-chip][data-active], [data-generate-btn]'
    ))
  }

  function focusEl(el: HTMLElement, atEnd: boolean) {
    el.focus()
    if (el instanceof HTMLInputElement) {
      const pos = atEnd ? el.value.length : 0
      el.setSelectionRange(pos, pos)
    }
  }

  function handleEditorKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    const isInput = target instanceof HTMLInputElement && target.type === 'text'
    const isChip = 'loaderChip' in target.dataset
    const isGenerate = 'generateBtn' in target.dataset
    if (!isInput && !isChip && !isGenerate) return

    const form = e.currentTarget as HTMLFormElement

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const goDown = e.key === 'ArrowDown'
      const navItems = getNavItems(form)
      const idx = isChip
        ? navItems.findIndex(el => 'loaderChip' in el.dataset)
        : navItems.indexOf(target)
      const next = navItems[idx + (goDown ? 1 : -1)]
      if (next) { e.preventDefault(); focusEl(next, !goDown) }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const goRight = e.key === 'ArrowRight'
      if (isChip) {
        const chips = Array.from(form.querySelectorAll<HTMLElement>('[data-loader-chip]'))
        const next = chips[chips.indexOf(target) + (goRight ? 1 : -1)]
        if (next) { e.preventDefault(); next.click(); next.focus() }
      } else if (isInput) {
        const input = target as HTMLInputElement
        const len = input.value.length
        const atEdge = goRight
          ? input.selectionStart === len && input.selectionEnd === len
          : input.selectionStart === 0 && input.selectionEnd === 0
        if (atEdge) {
          const navItems = getNavItems(form)
          const next = navItems[navItems.indexOf(input) + (goRight ? 1 : -1)]
          if (next) { e.preventDefault(); focusEl(next, !goRight) }
        }
      }
    } else if (e.key === 'Enter') {
      if (isInput || isChip) {
        e.preventDefault()
        const navItems = getNavItems(form)
        const idx = isChip
          ? navItems.findIndex(el => 'loaderChip' in el.dataset)
          : navItems.indexOf(target)
        const next = navItems[idx + 1]
        if (next) focusEl(next, false)
      }
      // isGenerate: let browser submit normally
    }
  }

  function handleEditorFocus(e: FocusEvent) {
    const target = e.target as HTMLElement
    if (!(target instanceof HTMLInputElement) || target.type !== 'text') return
    const input = target
    requestAnimationFrame(() => {
      if (input.selectionStart === 0 && input.selectionEnd === input.value.length && input.value.length > 0) {
        input.setSelectionRange(input.value.length, input.value.length)
      }
    })
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
        <Line />
        <Line comment="Dependencies" />
        <Line key="minecraft_version">
          <ValuePicker
            value={getForm().mcVersion}
            setValue={v => updateForm('mcVersion', v)}
            onFocus={() => setCurrentDoc('minecraft_version')}
            items={mcVersions}
            placeholder="e.g. 1.21.1"
          />
        </Line>
        <Line key="mod_loader">
          <LoaderValue value={getForm().loader} onChange={l => { updateForm('loader', l); setCurrentDoc(`loader_${l}`) }} onFocus={() => setCurrentDoc(`loader_${getForm().loader}`)} />
        </Line>
        <Show when={needsFabric(getForm())}>
          <Line key="fabric_loader_version"><ResourceValue resource={fabricLoaderVersion} /></Line>
          <Line key="fabric_api_version"><ResourceValue resource={fabricApiVersion} /></Line>
        </Show>
        <Show when={needsNeoForge(getForm())}>
          <Line key="neoforge_version"><ResourceValue resource={neoforgeVersion} /></Line>
        </Show>
        <Show when={needsForge(getForm())}>
          <Line key="forge_version"><ResourceValue resource={forgeVersion} /></Line>
        </Show>
        <Line />
        <Line><SubmitValue /></Line>
      </form>
    </Card>
  )
}
