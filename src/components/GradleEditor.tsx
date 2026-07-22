import {
  createSignal, createEffect, createResource, For, Show, Suspense,
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
  allowSnapshots: () => boolean
  onSnapshotsChange: (v: boolean) => void
}) {
  const [inputVal, setInputVal] = createSignal('')
  const [open, setOpen] = createSignal(false)
  const [versions] = createResource(
    () => props.allowSnapshots() ? 'all' : 'releases',
    mode => getMinecraftVersions(mode === 'all'),
  )

  const filtered = () => {
    const q = inputVal().toLowerCase()
    const all = versions() ?? []
    if (!q || q === props.value.toLowerCase()) return all
    return all.filter(v => v.includes(q))
  }

  function select(v: string) {
    setInputVal(v)
    setOpen(false)
    props.onSelect(v)
  }

  createEffect(() => {
    const vs = versions()
    if (!vs?.length) return
    if (!props.value || !vs.includes(props.value)) select(vs[0])
    else setInputVal(props.value)
  })

  function handleBlur() {
    setTimeout(() => {
      setOpen(false)
      if (!versions()?.includes(inputVal())) setInputVal(props.value || '')
    }, 150)
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
              onInput={e => { setInputVal(e.currentTarget.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              onBlur={handleBlur}
              placeholder="e.g. 1.21.1"
              autocomplete="off"
              spellcheck={false}
            />
            <Show when={open() && (versions()?.length ?? 0) > 0}>
              <ul class={styles.dropdown}>
                <For each={filtered().slice(0, 80)}>
                  {v => (
                    <li
                      class={props.value === v ? styles.activeOption : undefined}
                      onMouseDown={() => select(v)}
                    >{v}</li>
                  )}
                </For>
              </ul>
            </Show>
          </span>
        </Suspense>
        <label class={styles.snapshotToggle}>
          <input
            type="checkbox"
            checked={props.allowSnapshots()}
            onChange={e => props.onSnapshotsChange(e.currentTarget.checked)}
          />
          <span class={styles.comment}>snapshots</span>
        </label>
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
      <For each={LOADERS}>
        {l => (
          <button
            type="button"
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
  const [includeSnapshots, setIncludeSnapshots] = createSignal(false)
  const defaults = () => deriveDefaults(props.form)

  function handleModId(val: string) {
    props.setForm('modId', val.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64))
  }

  function fillDefaults() {
    props.setForm(deriveDefaults(props.form))
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    props.onSubmit?.()
  }

  return (
    <form class={styles.editor} onSubmit={handleSubmit}>
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
          allowSnapshots={includeSnapshots}
          onSnapshotsChange={setIncludeSnapshots}
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
      </div>
      <div class={styles.footer}>
        <button type="button" class={styles.defaultsBtn} onClick={fillDefaults}>
          Fill Defaults
        </button>
        <button type="submit" class={styles.submitBtn}>
          Generate Template
        </button>
      </div>
    </form>
  )
}
