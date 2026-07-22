import { createResource } from 'solid-js'
import './App.css'
import { getNeoforgeVersion, getForgeVersion, getFabricLoaderVerison, getFabricApiVersion } from './core/versionFetch'
import { needsFabric, needsNeoForge, needsForge } from './core'
import { getForm } from './store'
import GradleEditor from './components/GradleEditor'
import DescriptionPanel from './components/DescriptionPanel'

export default function App() {

  const [fabricLoaderVersion] = createResource(
    () => (needsFabric(getForm()) && getForm().mcVersion) || undefined,
    getFabricLoaderVerison,
  );
  const [fabricApiVersion] = createResource(
    () => (needsFabric(getForm()) && getForm().mcVersion) || undefined,
    getFabricApiVersion,
  );
  const [neoforgeVersion] = createResource(
    () => needsNeoForge(getForm()) ? getForm().mcVersion : undefined,
    getNeoforgeVersion,
  );
  const [forgeVersion] = createResource(
    () => needsForge(getForm()) ? getForm().mcVersion : undefined,
    getForgeVersion,
  );

  function handleSubmit() {
    const f = getForm()
    alert(`Generating ${f.loader} template for "${f.modName}" (MC ${f.mcVersion})`)
  }

  return (
    <main id="generator">
      <header class="gen-header">
        <h1>Mod Template Generator</h1>
      </header>

      <div class="gen-layout">
        <div class="gen-editor">
          <GradleEditor
            fabricLoaderVersion={fabricLoaderVersion}
            fabricApiVersion={fabricApiVersion}
            neoforgeVersion={neoforgeVersion}
            forgeVersion={forgeVersion}
            onSubmit={handleSubmit}
          />
        </div>
        <DescriptionPanel />
      </div>
    </main>
  )
}
