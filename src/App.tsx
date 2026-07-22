import {
  createSignal,
  createEffect,
  createResource,
  For,
  Suspense,
} from 'solid-js'
import './App.css'
import { getMinecraftVersions, getNeoforgeVersion, getFabricLoaderVerison, getFabricApiVersion } from './core/versionFetch'
import GradlePropertiesPanel from './components/GradlePropertiesPanel'
import type { Loader } from './core/types'

const LOADERS: { id: Loader; name: string; desc: string }[] = [
  { id: 'fabric',      name: 'Fabric',      desc: 'Lightweight & fast. Best for performance mods and small projects.' },
  { id: 'neoforge',   name: 'NeoForge',    desc: 'Maintained Forge fork. Large mod ecosystem, rich API surface.' },
  { id: 'multiloader', name: 'Multiloader', desc: 'Target Fabric & NeoForge from one shared codebase.' },
]

// ── component ─────────────────────────────────────────────────────────────────

export default function App() {
  const [includeSnapshots, setIncludeSnapshots] = createSignal(false);
  const [mcVersion, setMcVersion] = createSignal('');
  const [modName, setModName] = createSignal('');
  const [modId, setModId] = createSignal('');
  const [modVersion, setModVersion] = createSignal('1.0.0');
  const [authors, setAuthors] = createSignal('');
  const [loader, setLoader] = createSignal<Loader>('fabric');

  function handleModIdChange(val: string) {
    setModId(val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 64))
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    alert(`Generating ${loader()} template for "${modName()}" (MC ${mcVersion()})`)
  }

  const needsFabric = () => loader() === 'fabric' || loader() === 'multiloader'
  const needsNeoForge = () => loader() === 'neoforge' || loader() === 'multiloader'

  const [fabricLoaderVersion] = createResource(
    () => (needsFabric() && mcVersion()) || undefined,
    getFabricLoaderVerison,
  );
  const [fabricApiVersion] = createResource(
    () => (needsFabric() && mcVersion()) || undefined,
    getFabricApiVersion,
  );
  const [neoforgeVersion] = createResource(
    () => (needsNeoForge() && mcVersion()) || undefined,
    getNeoforgeVersion,
  );

  return (
    <main id="generator">
      <header class="gen-header">
        <h1>Mod Template Generator</h1>
        <p>Fill in the fields, pick a loader, and download your starter project.</p>
      </header>

      <div class="gen-layout">
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

          <MinecraftVersionPicker allowSnapshots={includeSnapshots} onSelect={setMcVersion} />

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

          <div class="field">
            <label for="mod-version">Mod Version</label>
            <input
              id="mod-version"
              type="text"
              placeholder="1.0.0"
              value={modVersion()}
              onInput={e => setModVersion(e.currentTarget.value)}
              required
            />
          </div>

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

          <button type="submit" class="gen-btn">
            Generate Template
          </button>
        </form>

        <GradlePropertiesPanel
          mcVersion={mcVersion}
          modId={modId}
          modName={modName}
          modVersion={modVersion}
          authors={authors}
          loader={loader}
          needsFabric={needsFabric}
          needsNeoForge={needsNeoForge}
          fabricLoaderVersion={fabricLoaderVersion}
          fabricApiVersion={fabricApiVersion}
          neoforgeVersion={neoforgeVersion}
        />
      </div>
    </main>
  )
}

// ── MinecraftVersionPicker ────────────────────────────────────────────────────

function MinecraftVersionPicker(props: { allowSnapshots: () => boolean, onSelect: (mcVersion: string) => void }) {
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

