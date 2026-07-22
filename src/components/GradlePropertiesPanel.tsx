import { createSignal, onCleanup, Show, type Resource } from 'solid-js'
import styles from './GradlePropertiesPanel.module.css'
import { type FormState, needsFabric, needsNeoForge, needsForge, deriveDefaults } from '../core'

export default function GradlePropertiesPanel(props: {
  form: FormState
  fabricLoaderVersion: Resource<string | null>
  fabricApiVersion: Resource<string | null>
  neoforgeVersion: Resource<string | null>
  forgeVersion: Resource<string | null>
}) {
  const [frame, setFrame] = createSignal(0);
  const timer = setInterval(() => setFrame(f => (f + 1) % 3), 500);
  onCleanup(() => clearInterval(timer));
  
  const loading = () => `loading${'...'.slice(0, frame() + 1)}`;
  const hasFabric = () => needsFabric(props.form);
  const hasNeoforge = () => needsNeoForge(props.form);
  const hasForge = () => needsForge(props.form);
  const defaults = () => deriveDefaults(props.form);


  function Line(props: { comment?: string, key?: string, value?: string, placeholder?: string }) {
    return <div class={styles.line}>
      {props.key && <><span class={styles.key}>{props.key}</span><span class={styles.eq}>=</span></>}
      {props.value && <span class={styles.val}>{props.value}</span>}
      {!props.value && props.placeholder && <span class={styles.placeholder}>{props.placeholder}</span>}
      {props.comment && <span class={styles.comment}># {props.comment}</span>}
    </div>;
  }

  function ResourceLine(props: { key: string, resource: Resource<string | null> }) {
    return (
      <Line key={props.key} value={props.resource.loading ? undefined : props.resource()} placeholder={props.resource.loading ? loading() : 'unavailable'} />
    )
  }

  return (
    <aside class={styles.panel}>
      <div class={styles.header}>gradle.properties</div>
      <div class={styles.body}>
        <Line comment="Mod Properties" />
        <Line key="mod_name" value={props.form.modName} placeholder={defaults().modName} />
        <Line key="mod_id" value={props.form.modId} placeholder={defaults().modId} />
        <Line key="mod_version" value={props.form.modVersion} placeholder={defaults().modVersion} />
        <Line key="mod_authors" value={props.form.authors} placeholder={defaults().authors} />
        <Line key="maven_group" value={props.form.projectPackage} placeholder={defaults().projectPackage} />
        <Line />
        <Line comment="Dependencies" />
        <Line key="minecraft_version" value={props.form.mcVersion} placeholder={defaults().mcVersion} />
        <Show when={hasFabric()}>
          <ResourceLine key="fabric_loader_version" resource={props.fabricLoaderVersion} />
          <ResourceLine key="fabric_api_version" resource={props.fabricApiVersion} />
        </Show>
        <Show when={hasNeoforge()}>
          <ResourceLine key="neoforge_version" resource={props.neoforgeVersion} />
        </Show>
        <Show when={hasForge()}>
          <ResourceLine key="forge_version" resource={props.forgeVersion} />
        </Show>
      </div>
    </aside>
  );
}
