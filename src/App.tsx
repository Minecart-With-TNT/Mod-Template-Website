import { createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import './App.css'
import { getNeoforgeVersion, getForgeVersion, getFabricLoaderVerison, getFabricApiVersion } from './core/versionFetch'
import { type FormState, needsFabric, needsNeoForge, needsForge } from './core'
import GradleEditor from './components/GradleEditor'

export default function App() {
  const [form, setForm] = createStore<FormState>({
    mcVersion: '',
    modName: '',
    modId: '',
    modVersion: '',
    authors: '',
    loader: 'fabric',
    projectPackage: '',
  });

  const [fabricLoaderVersion] = createResource(
    () => (needsFabric(form) && form.mcVersion) || undefined,
    getFabricLoaderVerison,
  );
  const [fabricApiVersion] = createResource(
    () => (needsFabric(form) && form.mcVersion) || undefined,
    getFabricApiVersion,
  );
  const [neoforgeVersion] = createResource(
    () => needsNeoForge(form) ? form.mcVersion : undefined,
    getNeoforgeVersion,
  );
  const [forgeVersion] = createResource(
    () => needsForge(form) ? form.mcVersion : undefined,
    getForgeVersion,
  );

  function handleSubmit() {
    alert(`Generating ${form.loader} template for "${form.modName}" (MC ${form.mcVersion})`)
  }

  return (
    <main id="generator">
      <header class="gen-header">
        <h1>Mod Template Generator</h1>
      </header>

      <div class="gen-layout">
        <GradleEditor
          form={form}
          setForm={setForm}
          fabricLoaderVersion={fabricLoaderVersion}
          fabricApiVersion={fabricApiVersion}
          neoforgeVersion={neoforgeVersion}
          forgeVersion={forgeVersion}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  )
}
