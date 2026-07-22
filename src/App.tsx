import './App.css'
import { getForm } from './store'
import GradleEditor from './components/GradleEditor'
import DescriptionPanel from './components/DescriptionPanel'

export default function App() {


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
          <GradleEditor onSubmit={handleSubmit} />
        </div>
        <DescriptionPanel />
      </div>
    </main>
  )
}
