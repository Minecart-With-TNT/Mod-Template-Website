import { createSignal, createEffect, createResource, For, Show, Suspense } from 'solid-js'
import { type SetStoreFunction } from 'solid-js/store'
import { getMinecraftVersions } from '../core/versionFetch'
import { deriveDefaults } from '../core/utils'
import { type Loader, type FormState } from '../core/types'
import styles from './Form.module.css'

const LOADERS: { id: Loader; name: string; desc: string }[] = [
  { id: 'fabric',      name: 'Fabric',      desc: 'Lightweight & fast. Best for performance mods and small projects.' },
  { id: 'neoforge',   name: 'NeoForge',    desc: 'Maintained Forge fork. Large mod ecosystem, rich API surface.' },
  { id: 'multiloader', name: 'Multiloader', desc: 'Target Fabric & NeoForge from one shared codebase.' },
]

function McVersionCombobox(props: {
  allowSnapshots: () => boolean
  value: string
  onSelect: (v: string) => void
}) {
  const [inputVal, setInputVal] = createSignal('');
  const [open, setOpen] = createSignal(false);
  const [minecraftVersions] = createResource(
    () => (props.allowSnapshots() ? 'all' : 'releases'),
    mode => getMinecraftVersions(mode === 'all'),
  );

  const filtered = () => {
    const q = inputVal().toLowerCase();
    const all = minecraftVersions() ?? [];
    if (!q || q === props.value.toLowerCase()) return all;
    return all.filter(v => v.includes(q));
  };

  function select(v: string) {
    setInputVal(v);
    setOpen(false);
    props.onSelect(v);
  }

  createEffect(() => {
    const versions = minecraftVersions();
    if (!versions?.length) return;
    if (!props.value || !versions.includes(props.value)) {
      select(versions[0]);
    } else {
      setInputVal(props.value);
    }
  });

  function handleBlur() {
    setTimeout(() => {
      setOpen(false);
      const versions = minecraftVersions();
      if (!versions?.includes(inputVal())) {
        setInputVal(props.value || '');
      }
    }, 150);
  }

  return (
    <Suspense fallback={<div class={styles.skeletonInput} />}>
      <div class={styles.combobox}>
        <input
          type="text"
          value={inputVal()}
          onInput={e => { setInputVal(e.currentTarget.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder="e.g. 1.21.1"
          autocomplete="off"
        />
        <Show when={open() && (minecraftVersions()?.length ?? 0) > 0}>
          <ul class={styles.dropdown}>
            <For each={filtered().slice(0, 80)}>{v => (
              <li
                class={props.value === v ? styles.activeOption : undefined}
                onMouseDown={() => select(v)}
              >{v}</li>
            )}</For>
          </ul>
        </Show>
      </div>
    </Suspense>
  );
}

export default function Form(props: {
  form: FormState
  setForm: SetStoreFunction<FormState>
  onSubmit?: () => void
}) {
  const [includeSnapshots, setIncludeSnapshots] = createSignal(false);

  const defaults = () => deriveDefaults(props.form)

  function handleModIdChange(val: string) {
    props.setForm('modId', val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 64))
  }

  function fillDefaults() {
    props.setForm(deriveDefaults(props.form))
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    props.onSubmit?.()
  }

  return (
    <form class={styles.form} onSubmit={handleSubmit}>
      <div class={styles.topRow}>
        <div class={styles.field} style="flex:1">
          <label for="mc-version">Minecraft Version</label>
          <McVersionCombobox
            allowSnapshots={includeSnapshots}
            value={props.form.mcVersion}
            onSelect={v => props.setForm('mcVersion', v)}
          />
        </div>
        <label class={styles.checkRow}>
          <input
            type="checkbox"
            checked={includeSnapshots()}
            onChange={e => setIncludeSnapshots(e.currentTarget.checked)}
          />
          Snapshots
        </label>
      </div>

      <div class={styles.row2}>
        <div class={styles.field}>
          <label for="mod-name">Mod Name</label>
          <input
            id="mod-name"
            type="text"
            placeholder={defaults().modName}
            value={props.form.modName}
            onInput={e => props.setForm('modName', e.currentTarget.value)}
            required
          />
        </div>
        <div class={styles.field}>
          <label for="mod-id">
            Mod ID
            <span class={styles.hint}>a-z 0-9 _</span>
          </label>
          <input
            id="mod-id"
            type="text"
            placeholder={defaults().modId}
            value={props.form.modId}
            onInput={e => handleModIdChange(e.currentTarget.value)}
            pattern="[a-z0-9_]*"
          />
        </div>
      </div>

      <div class={styles.row2}>
        <div class={styles.field}>
          <label for="mod-version">Version</label>
          <input
            id="mod-version"
            type="text"
            placeholder={defaults().modVersion}
            value={props.form.modVersion}
            onInput={e => props.setForm('modVersion', e.currentTarget.value)}
            required
          />
        </div>
        <div class={styles.field}>
          <label for="authors">
            Authors
            <span class={styles.hint}>comma-sep</span>
          </label>
          <input
            id="authors"
            type="text"
            placeholder={defaults().authors}
            value={props.form.authors}
            onInput={e => props.setForm('authors', e.currentTarget.value)}
            required
          />
        </div>
      </div>

      <div class={styles.field}>
        <label for="project-package">
          Project Package
          <span class={styles.hint}>Java package</span>
        </label>
        <input
          id="project-package"
          type="text"
          placeholder={defaults().projectPackage}
          value={props.form.projectPackage}
          onInput={e => props.setForm('projectPackage', e.currentTarget.value)}
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

      <div class={styles.actions}>
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
