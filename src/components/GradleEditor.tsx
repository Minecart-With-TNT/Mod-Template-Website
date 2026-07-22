import {
  createSignal, createEffect, createResource, onMount, For, Show, Suspense,
  type Resource,
} from 'solid-js'
import { type SetStoreFunction } from 'solid-js/store'
import {
  type FormState, type Loader,
  needsFabric, needsNeoForge, needsForge, deriveDefaults, getMinecraftVersions,
} from '../core'
import styles from './GradleEditor.module.css'

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

// ── Editable field line ─────────────────────────────────────────────────

function EditLine(props: {
  propKey: string
  value: string
  placeholder: string
  onInput: (v: string) => void
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
          value={props.value}
          placeholder={props.placeholder}
          onInput={e => props.onInput(e.currentTarget.value)}
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

// ── Minecraft version combobox line ─────────────────────────────────────

function McVersionLine(props: {
  value: string
  onSelect: (v: string) => void
}) {
  const [inputVal, setInputVal] = createSignal('')
  const [open, setOpen] = createSignal(false)
  const [allowSnapshots, setAllowSnapshots] = createSignal(false)
  const [highlightIdx, setHighlightIdx] = createSignal(0)

  let dropdownEl!: HTMLUListElement
  let clickToFocus = false
  let escapeSuppressed = false  // typing won't reopen after Escape until click or Ctrl+Space
  let ctrlSpaceTs = 0           // timestamp of last Ctrl+Space, to guard against OS-level blur

  const [versions] = createResource(
    () => allowSnapshots() ? 'all' : 'releases',
    mode => getMinecraftVersions(mode === 'all'),
  )

  const filteredList = () => {
    const q = inputVal().toLowerCase()
    const all = versions() ?? []
    if (!q || q === props.value.toLowerCase()) return all
    return all.filter(v => v.includes(q))
  }

  // User explicitly chose a version — close dropdown
  function select(v: string) {
    setInputVal(v)
    setOpen(false)
    props.onSelect(v)
  }

  // Auto-sync when version list changes (snapshot toggle, initial load) — never closes dropdown
  createEffect(() => {
    const vs = versions()
    if (!vs?.length) return
    if (!props.value || !vs.includes(props.value)) {
      setInputVal(vs[0])
      props.onSelect(vs[0])
    } else {
      setInputVal(props.value)
    }
  })

  // Sync keyboard highlight to current value when list changes
  createEffect(() => {
    const list = filteredList()
    const idx = list.indexOf(props.value)
    setHighlightIdx(idx >= 0 ? idx : 0)
  })

  // Scroll highlighted item into view by directly setting scrollTop
  createEffect(() => {
    const idx = highlightIdx()
    if (!open()) return
    requestAnimationFrame(() => {
      const el = dropdownEl
      if (!el) return
      const items = el.querySelectorAll<HTMLLIElement>('li')
      const item = items[idx]
      if (!item) return
      const top = item.offsetTop
      const bottom = top + item.offsetHeight
      if (bottom > el.scrollTop + el.clientHeight) el.scrollTop = bottom - el.clientHeight
      else if (top < el.scrollTop) el.scrollTop = top
    })
  })

  function handleBlur(e: FocusEvent) {
    if (Date.now() - ctrlSpaceTs < 300) return  // ignore OS-level blur from Ctrl+Space
    if (dropdownEl?.contains(e.relatedTarget as Node)) return
    setTimeout(() => {
      setOpen(false)
      if (!versions()?.includes(inputVal())) setInputVal(props.value || '')
    }, 150)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault()
      e.stopPropagation()
      ctrlSpaceTs = Date.now()
      escapeSuppressed = false
      if (!open()) setOpen(true)
      else setAllowSnapshots(v => !v)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      escapeSuppressed = true
    } else if (open()) {
      if (e.code === 'Space') {
        // Swallow any stray space event when dropdown is open
        e.preventDefault()
        e.stopPropagation()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setHighlightIdx(i => Math.min(i + 1, filteredList().length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setHighlightIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        const item = filteredList()[highlightIdx()]
        if (item) select(item)
      }
      // ArrowLeft/ArrowRight: no stopPropagation → bubbles to form-level nav
    }
  }

  return (
    <div class={styles.line}>
      <span class={styles.key}>minecraft_version</span>
      <span class={styles.eq}>=</span>
      <span class={styles.editCell}>
        <Suspense fallback={<span class={styles.placeholder}>loading...</span>}>
          <span class={styles.comboWrap}>
            <input
              type="text"
              class={styles.inlineInput}
              value={inputVal()}
              onInput={e => {
                setInputVal(e.currentTarget.value)
                if (!escapeSuppressed) setOpen(true)
              }}
              onMouseDown={() => { clickToFocus = true; escapeSuppressed = false }}
              onFocus={() => { if (clickToFocus) { setOpen(true); clickToFocus = false } }}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 1.21.1"
              autocomplete="off"
              spellcheck={false}
            />
            <Show when={open()}>
              <div class={styles.dropdownWrap}>
                <ul ref={dropdownEl} class={styles.dropdown}>
                  <For each={filteredList()}>
                    {(v, i) => (
                      <li
                        classList={{
                          [styles.activeOption]: props.value === v,
                          [styles.highlightedOption]: i() === highlightIdx(),
                        }}
                        onMouseDown={() => select(v)}
                      >{v}</li>
                    )}
                  </For>
                </ul>
                <div
                  class={styles.dropdownFooter}
                  onMouseDown={e => {
                    e.preventDefault()
                    setAllowSnapshots(v => !v)
                  }}
                >
                  <input type="checkbox" checked={allowSnapshots()} readOnly />
                  <span>Include snapshots</span>
                  <kbd class={styles.kbd}>Ctrl+Space</kbd>
                </div>
              </div>
            </Show>
          </span>
        </Suspense>
      </span>
    </div>
  )
}

// ── Loader picker ───────────────────────────────────────────────────────

function LoaderLine(props: { value: Loader; onChange: (l: Loader) => void }) {
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
  form: FormState
  setForm: SetStoreFunction<FormState>
  fabricLoaderVersion: Resource<string | null>
  fabricApiVersion: Resource<string | null>
  neoforgeVersion: Resource<string | null>
  forgeVersion: Resource<string | null>
  onSubmit?: () => void
}) {
  const defaults = () => deriveDefaults(props.form)

  let formEl!: HTMLFormElement

  onMount(() => {
    formEl.querySelector<HTMLInputElement>('input[type="text"]')?.focus()
  })

  function handleModId(val: string) {
    props.setForm('modId', val.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64))
  }

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

  function handleBodyMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (target.closest('input, button, label, select, textarea')) return
    e.preventDefault()
    if (!formEl.contains(document.activeElement)) {
      formEl.querySelector<HTMLElement>('input[type="text"]')?.focus()
    }
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
        <EditLine propKey="mod_name"    value={props.form.modName}        placeholder={defaults().modName}        onInput={v => props.setForm('modName', v)} />
        <EditLine propKey="mod_id"      value={props.form.modId}          placeholder={defaults().modId}          onInput={handleModId} comment="a-z 0-9 _ -" />
        <EditLine propKey="mod_version" value={props.form.modVersion}     placeholder={defaults().modVersion}     onInput={v => props.setForm('modVersion', v)} />
        <EditLine propKey="mod_authors" value={props.form.authors}        placeholder={defaults().authors}        onInput={v => props.setForm('authors', v)} comment="comma separated" />
        <EditLine propKey="maven_group" value={props.form.projectPackage} placeholder={defaults().projectPackage} onInput={v => props.setForm('projectPackage', v)} />
        <EmptyLine />
        <CommentLine text="Dependencies" />
        <McVersionLine
          value={props.form.mcVersion}
          onSelect={v => props.setForm('mcVersion', v)}
        />
        <LoaderLine value={props.form.loader} onChange={l => props.setForm('loader', l)} />
        <Show when={needsFabric(props.form)}>
          <ResourceLine propKey="fabric_loader_version" resource={props.fabricLoaderVersion} />
          <ResourceLine propKey="fabric_api_version"    resource={props.fabricApiVersion} />
        </Show>
        <Show when={needsNeoForge(props.form)}>
          <ResourceLine propKey="neoforge_version" resource={props.neoforgeVersion} />
        </Show>
        <Show when={needsForge(props.form)}>
          <ResourceLine propKey="forge_version" resource={props.forgeVersion} />
        </Show>
        <EmptyLine />
        <SubmitLine />
      </div>
    </form>
  )
}
