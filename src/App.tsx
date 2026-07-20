import {
  createSignal,
  createEffect,
  createResource,
  createMemo,
  Show,
  For,
  Suspense,
} from 'solid-js'
import './App.css'
import { getMinecraftVersions, getNeoforgeVersion, getFabricLoaderVerison } from './core/versionFetch'

// ── types ────────────────────────────────────────────────────────────────────

type Loader = 'fabric' | 'neoforge' | 'multiloader'

const LOADERS: { id: Loader; name: string; desc: string }[] = [
  { id: 'fabric',      name: 'Fabric',      desc: 'Lightweight & fast. Best for performance mods and small projects.' },
  { id: 'neoforge',   name: 'NeoForge',    desc: 'Maintained Forge fork. Large mod ecosystem, rich API surface.' },
  { id: 'multiloader', name: 'Multiloader', desc: 'Target Fabric & NeoForge from one shared codebase.' },
]



// ── helpers ───────────────────────────────────────────────────────────────────

function toModId(name: string) {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 64)
}

// ── component ─────────────────────────────────────────────────────────────────

export default function App() {
  // Form state
  const [includeSnapshots, setIncludeSnapshots] = createSignal(false);
  const [mcVersion, setMcVersion] = createSignal('');
  const [modName, setModName] = createSignal('');
  const [modId, setModId] = createSignal('');
  const [modIdTouched, setModIdTouched] = createSignal(false);
  const [authors, setAuthors] = createSignal('');
  const [loader, setLoader] = createSignal<Loader>('fabric');
  
  function handleModIdChange(val: string) {
    setModIdTouched(true)
    setModId(val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 64))
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    // TODO: generate zip
    alert(`Generating ${loader()} template for "${modName()}" (MC ${mcVersion()})`)
  }

  const needsFabric = () => loader() === 'fabric' || loader() === 'multiloader'
  const needsNeoForge = () => loader() === 'neoforge' || loader() === 'multiloader'

  return (
    <main id="generator">
      <header class="gen-header">
        <h1>Mod Template Generator</h1>
        <p>Fill in the fields, pick a loader, and download your starter project.</p>
      </header>

      <form class="gen-form" onSubmit={handleSubmit}>
        <div class="field">
          <label for="include-snapshots">Include Snapshots</label>
          <input
            id="include-snapshots"
            type="checkbox"
            checked={includeSnapshots()}
            onChange={e => setIncludeSnapshots(e.currentTarget.checked)}
          />
        </div>

        {/* ── Minecraft version ── */}
        <MinecraftVersionPicker allowSnapshots={includeSnapshots} onSelect={setMcVersion} />

        {/* ── Mod name ── */}
        <div class="field">
          <label for="mod-name">Mod Name</label>
          <input
            id="mod-name"
            type="text"
            placeholder="My Awesome Mod"
            value={modName()}
            onInput={e => setModName(e.currentTarget.value)}
            required
          />
        </div>

        {/* ── Mod ID ── */}
        <div class="field">
          <label for="mod-id">
            Mod ID
            <span class="hint">lowercase, underscores only</span>
          </label>
          <input
            id="mod-id"
            type="text"
            placeholder="my_awesome_mod"
            value={modId()}
            onInput={e => handleModIdChange(e.currentTarget.value)}
            required
            pattern="[a-z0-9_]+"
          />
        </div>

        {/* ── Authors ── */}
        <div class="field">
          <label for="authors">
            Authors
            <span class="hint">comma-separated</span>
          </label>
          <input
            id="authors"
            type="text"
            placeholder="Alice, Bob"
            value={authors()}
            onInput={e => setAuthors(e.currentTarget.value)}
            required
          />
        </div>

        {/* ── Loader picker ── */}
        <fieldset class="loader-group">
          <legend>Mod Loader</legend>
          <div class="loader-cards">
            <For each={LOADERS}>
              {l => (
                <label
                  class={`loader-card${loader() === l.id ? ' selected' : ''}`}
                  for={`loader-${l.id}`}
                >
                  <input
                    id={`loader-${l.id}`}
                    type="radio"
                    name="loader"
                    value={l.id}
                    checked={loader() === l.id}
                    onChange={() => setLoader(l.id)}
                  />
                  <span class="loader-name">{l.name}</span>
                  <span class="loader-desc">{l.desc}</span>
                </label>
              )}
            </For>
          </div>
        </fieldset>

        {/* ── Fabric loader version ── */}
        <Show when={needsFabric()}>
          <VersionView label="Fabric Loader" mcVersion={mcVersion} versionResolver={getFabricLoaderVerison} />
        </Show>

        {/* ── NeoForge version ── */}
        <Show when={needsNeoForge()}>
          <VersionView label="NeoForge" mcVersion={mcVersion} versionResolver={getNeoforgeVersion} />
        </Show>

        <button type="submit" class="gen-btn">
          Generate Template
        </button>

      </form>
    </main>
  )
}

function MinecraftVersionPicker(props: { allowSnapshots: () => boolean, onSelect: (mcVersion: string) => void }) {
  const [mcVersion, setMcVersion] = createSignal('');
  const [minecraftVersions] = createResource(props.allowSnapshots, getMinecraftVersions);

  function set(version: string) {
    setMcVersion(version);
    props.onSelect(version);
  }
  // Default MC version once list loads
  createEffect(async () => {
    const versions = minecraftVersions();
    console.log('createEffect called ', versions);
    if (versions?.length && !mcVersion()) set(versions[0]);
  })
  return (
    <div class="field">
      <label for="mc-version">Minecraft Version</label>
      <Suspense fallback={<div class="skeleton-input" />}>
        <select id="mc-version" value={mcVersion()} onChange={e => set(e.currentTarget.value)}>
          <For each={minecraftVersions()}>{v => <option value={v}>{v}</option>}</For>
        </select>
      </Suspense>
    </div>
  )
}

function VersionView(props: { label: string, mcVersion: () => string, versionResolver: (mcVersion: string) => Promise<string | null> }) {
  const [version] = createResource(props.mcVersion, props.versionResolver);
  return (
    <div class="field">
      <label for="version">{props.label}</label>
      <Suspense fallback={<div class="skeleton-input" />}>
        <Show
          when={version() !== null}
          fallback={<p class="version-unavailable">No {props.label} support for {props.mcVersion()}</p>}
        >
          <span>{version()}</span>
        </Show>
      </Suspense>
    </div>
  )
}

