import { createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import './App.css'
import { getNeoforgeVersion, getForgeVersion, getFabricLoaderVerison, getFabricApiVersion } from './core/versionFetch'
import { type FormState, needsFabric, needsNeoForge, needsForge } from './core'
import Form from './components/Form'
import GradlePropertiesPanel from './components/GradlePropertiesPanel'

export default function App() {
  const [form, setForm] = createStore<FormState>({
    mcVersion: '',
    modName: '',
    modId: '',
    modVersion: '1.0.0',
    authors: '',
    loader: 'fabric',
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
        <p>Fill in the fields, pick a loader, and download your starter project.</p>
      </header>

      <div class="gen-layout">
        <Form form={form} setForm={setForm} onSubmit={handleSubmit} />

        <GradlePropertiesPanel
          form={form}
          fabricLoaderVersion={fabricLoaderVersion}
          fabricApiVersion={fabricApiVersion}
          neoforgeVersion={neoforgeVersion}
          forgeVersion={forgeVersion}
        />
      </div>
    </main>
  )
}
