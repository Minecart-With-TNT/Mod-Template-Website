import { onMount, createResource, For, Show, type Resource } from 'solid-js'
import { type FormState, type Loader, needsFabric, needsNeoForge, needsForge, getMinecraftVersions } from '../core'
import styles from './GradleEditor.module.css'
import { LinePicker } from './LinePicker'
import { setCurrentDoc, getForm, getDefaults, updateForm } from '../store'
import type { DocId } from '../docs'

const LOADERS: { id: Loader; label: string }[] = [
  { id: 'fabric',       label: 'Fabric'      },
  { id: 'neoforge',    label: 'NeoForge'    },
  { id: 'multiloader', label: 'Multiloader' },
]

// ── Line primitives ─────────────────────────────────────────────────────

function CommentLine(props: { text: string }) {
  return (
    <div class={styles.line}>
      <span class={styles.comment}># {props.text}</span>
    </div>
  )
}

function EmptyLine() {
  return <div class={styles.line} />
}

function ResourceLine(props: { propKey: string; resource: Resource<string | null> }) {
  return (
    <div class={styles.line}>
      <span class={styles.key}>{props.propKey}</span>
      <span class={styles.eq}>=</span>
      {props.resource.loading
        ? <span class={styles.placeholder}>loading...</span>
        : props.resource()
          ? <span class={styles.val}>{props.resource()!}</span>
          : <span class={styles.placeholder}>unavailable</span>
      }
    </div>
  )
}

type StringFormKey = Exclude<keyof FormState, 'loader'>

// ── Editable field line ─────────────────────────────────────────────────

function EditLine(props: {
  propKey: string
  formKey: StringFormKey
  docId: DocId
  valueFixer?: (v: string) => string
  comment?: string
}) {
  return (
    <div class={styles.line}>
      <span class={styles.key}>{props.propKey}</span>
      <span class={styles.eq}>=</span>
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
        {props.comment && (
          <span class={`${styles.comment} ${styles.inlineComment}`}># {props.comment}</span>
        )}
      </span>
    </div>
  )
}

// ── Loader picker ───────────────────────────────────────────────────────

function LoaderLine(props: { value: Loader; onChange: (l: Loader) => void; onFocus?: () => void }) {
  return (
    <div class={`${styles.line} ${styles.loaderLine}`}>
      <span class={styles.key}>mod_loader</span>
      <span class={styles.eq}>=</span>
      <span class={styles.chipGroup}>
        <For each={LOADERS}>
          {l => (
            <button
              type="button"
              data-loader-chip
              data-active={props.value === l.id ? '' : undefined}
              classList={{
                [styles.loaderChip]: true,
                [styles.loaderChipActive]: props.value === l.id,
              }}
              onClick={() => props.onChange(l.id)}
              onFocus={props.onFocus}
            >
              {l.label}
            </button>
          )}
        </For>
      </span>
    </div>
  )
}

// ── Submit line ─────────────────────────────────────────────────────────

function SubmitLine() {
  return (
    <div class={styles.line}>
      <button type="submit" class={styles.generateChip} data-generate-btn>
        generate_template
      </button>
    </div>
  )
}

// ── Main export ─────────────────────────────────────────────────────────

export default function GradleEditor(props: {
  fabricLoaderVersion: Resource<string | null>
  fabricApiVersion: Resource<string | null>
  neoforgeVersion: Resource<string | null>
  forgeVersion: Resource<string | null>
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

  function handleBodyMouseDown(_e: MouseEvent) {
    // TODO fix
    // const target = e.target as HTMLElement
    // if (target.closest('input, button, label, select, textarea')) return
    // e.preventDefault()
    // if (!formEl.contains(document.activeElement)) {
    //   formEl.querySelector<HTMLElement>('input[type="text"]')?.focus()
    // }
  }

  return (
    <form
      ref={formEl}
      class={styles.editor}
      onSubmit={handleSubmit}
      onKeyDown={handleEditorKeyDown}
      onFocus={handleEditorFocus}
      onMouseDown={handleBodyMouseDown}
    >
      <div class={styles.fileHeader}>gradle.properties</div>
      <div class={styles.body}>
        <CommentLine text="Mod Properties" />
        <EditLine propKey="mod_name"    formKey="modName"        docId="mod_name" />
        <EditLine propKey="mod_id"      formKey="modId"          docId="mod_id"   valueFixer={v => v.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64)} />
        <EditLine propKey="mod_version" formKey="modVersion"     docId="mod_version" />
        <EditLine propKey="mod_authors" formKey="authors"        docId="mod_authors" />
        <EditLine propKey="maven_group" formKey="projectPackage" docId="maven_group" />
        <EmptyLine />
        <CommentLine text="Dependencies" />
        <LinePicker
          propKey="minecraft_version"
          value={getForm().mcVersion}
          setValue={v => updateForm('mcVersion', v)}
          onFocus={() => setCurrentDoc('minecraft_version')}
          items={mcVersions}
          placeholder="e.g. 1.21.1"
        />
        <LoaderLine value={getForm().loader} onChange={l => { updateForm('loader', l); setCurrentDoc(`loader_${l}`) }} onFocus={() => setCurrentDoc(`loader_${getForm().loader}`)} />
        <Show when={needsFabric(getForm())}>
          <ResourceLine propKey="fabric_loader_version" resource={props.fabricLoaderVersion} />
          <ResourceLine propKey="fabric_api_version"    resource={props.fabricApiVersion} />
        </Show>
        <Show when={needsNeoForge(getForm())}>
          <ResourceLine propKey="neoforge_version" resource={props.neoforgeVersion} />
        </Show>
        <Show when={needsForge(getForm())}>
          <ResourceLine propKey="forge_version" resource={props.forgeVersion} />
        </Show>
        <EmptyLine />
        <SubmitLine />
      </div>
    </form>
  )
}
