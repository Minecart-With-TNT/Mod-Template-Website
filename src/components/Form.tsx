import { createSignal, createEffect, createResource, For, Suspense } from 'solid-js'
import { type SetStoreFunction } from 'solid-js/store'
import { getMinecraftVersions } from '../core/versionFetch'
import { type Loader, type FormState } from '../core/types'
import styles from './Form.module.css'

const LOADERS: { id: Loader; name: string; desc: string }[] = [
  { id: 'fabric',      name: 'Fabric',      desc: 'Lightweight & fast. Best for performance mods and small projects.' },
  { id: 'neoforge',   name: 'NeoForge',    desc: 'Maintained Forge fork. Large mod ecosystem, rich API surface.' },
  { id: 'multiloader', name: 'Multiloader', desc: 'Target Fabric & NeoForge from one shared codebase.' },
]

function MinecraftVersionPicker(props: {
  allowSnapshots: () => boolean
  onSelect: (v: string) => void
}) {
  const [mcVersion, setMcVersion] = createSignal('');
  const [minecraftVersions] = createResource(
    () => (props.allowSnapshots() ? 'all' : 'releases'),
    mode => getMinecraftVersions(mode === 'all'),
  );

  function set(version: string) {
    setMcVersion(version);
    props.onSelect(version);
  }

  createEffect(() => {
    const versions = minecraftVersions();
    if (!versions?.length) return;
    const current = mcVersion();
    if (!current || !versions.includes(current)) set(versions[0]);
  })

  return (
    <div class={styles.field}>
      <label for="mc-version">Minecraft Version</label>
      <Suspense fallback={<div class={styles.skeletonInput} />}>
        <select id="mc-version" value={mcVersion()} onChange={e => set(e.currentTarget.value)}>
          <For each={minecraftVersions()}>{v => <option value={v}>{v}</option>}</For>
        </select>
      </Suspense>
    </div>
  )
}

export default function Form(props: {
  form: FormState
  setForm: SetStoreFunction<FormState>
  onSubmit?: () => void
}) {
  const [includeSnapshots, setIncludeSnapshots] = createSignal(false);

  function handleModIdChange(val: string) {
    props.setForm('modId', val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 64))
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    props.onSubmit?.()
  }

  return (
    <form class={styles.form} onSubmit={handleSubmit}>
      <div class={styles.field}>
        <label for="include-snapshots">Include Snapshots</label>
        <input
          id="include-snapshots"
          type="checkbox"
          checked={includeSnapshots()}
          onChange={e => setIncludeSnapshots(e.currentTarget.checked)}
        />
      </div>

      <MinecraftVersionPicker
        allowSnapshots={includeSnapshots}
        onSelect={v => props.setForm('mcVersion', v)}
      />

      <div class={styles.field}>
        <label for="mod-name">Mod Name</label>
        <input
          id="mod-name"
          type="text"
          placeholder="My Awesome Mod"
          value={props.form.modName}
          onInput={e => props.setForm('modName', e.currentTarget.value)}
          required
        />
      </div>

      <div class={styles.field}>
        <label for="mod-id">
          Mod ID
          <span class={styles.hint}>lowercase, underscores only</span>
        </label>
        <input
          id="mod-id"
          type="text"
          placeholder="my_awesome_mod"
          value={props.form.modId}
          onInput={e => handleModIdChange(e.currentTarget.value)}
          required
          pattern="[a-z0-9_]+"
        />
      </div>

      <div class={styles.field}>
        <label for="mod-version">Mod Version</label>
        <input
          id="mod-version"
          type="text"
          placeholder="1.0.0"
          value={props.form.modVersion}
          onInput={e => props.setForm('modVersion', e.currentTarget.value)}
          required
        />
      </div>

      <div class={styles.field}>
        <label for="authors">
          Authors
          <span class={styles.hint}>comma-separated</span>
        </label>
        <input
          id="authors"
          type="text"
          placeholder="Alice, Bob"
          value={props.form.authors}
          onInput={e => props.setForm('authors', e.currentTarget.value)}
          required
        />
      </div>

      <fieldset class={styles.loaderGroup}>
        <legend>Mod Loader</legend>
        <div class={styles.loaderCards}>
          <For each={LOADERS}>
            {l => (
              <label
                classList={{ [styles.loaderCard]: true, [styles.selected]: props.form.loader === l.id }}
                for={`loader-${l.id}`}
              >
                <input
                  id={`loader-${l.id}`}
                  type="radio"
                  name="loader"
                  value={l.id}
                  checked={props.form.loader === l.id}
                  onChange={() => props.setForm('loader', l.id)}
                />
                <span class={styles.loaderName}>{l.name}</span>
                <span class={styles.loaderDesc}>{l.desc}</span>
              </label>
            )}
          </For>
        </div>
      </fieldset>

      <button type="submit" class={styles.submitBtn}>
        Generate Template
      </button>
    </form>
  )
}
