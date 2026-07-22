import styles from './App.module.css'
import { getForm } from '../store'
import GradleEditor from './GradleEditor'
import DescriptionPanel from './DescriptionPanel'

export default function App() {

  function handleSubmit() {
    const f = getForm()
    alert(`Generating ${f.loader} template for "${f.modName}" (MC ${f.mcVersion})`)
  }

  return (
    <main class={styles.generator}>
      <header class={styles.header}>
        <h1>Mod Template Generator</h1>
      </header>

      <div class={styles.layout}>
        <div class={styles.editor}>
          <GradleEditor onSubmit={handleSubmit} />
        </div>
        <div class={styles.docs}>
          <DescriptionPanel />
        </div>
      </div>
    </main>
  )
}
