import { createSignal, onCleanup, Show, type Resource } from 'solid-js'
import styles from './GradlePropertiesPanel.module.css'
import { type FormState, needsFabric, needsNeoForge, needsForge, deriveDefaults } from '../core'

function LoadingText() {
  const [frame, setFrame] = createSignal(0);
  const timer = setInterval(() => setFrame(f => (f + 1) % 3), 500);
  onCleanup(() => clearInterval(timer));
  return <span class={styles.loading}>loading{'...'.slice(0, frame() + 1)}</span>;
}

function PropLine(props: { children: any }) {
  return <div class={styles.line}>{props.children}</div>;
}

function PropComment(props: { text: string }) {
  return <PropLine><span class={styles.comment}># {props.text}</span></PropLine>;
}

function PropBlank() {
  return <div class={styles.blank} />;
}

function PropEntry(props: { k: string; children: any }) {
  return (
    <PropLine>
      <span class={styles.key}>{props.k}</span>
      <span class={styles.eq}>=</span>
      {props.children}
    </PropLine>
  );
}

function StaticVal(props: { value: string; placeholder?: string }) {
  return (
    <Show when={props.value} fallback={<span class={styles.placeholder}>{props.placeholder ?? ''}</span>}>
      <span class={styles.val}>{props.value}</span>
    </Show>
  );
}

function VersionVal(props: { resource: Resource<string | null>; mc: string }) {
  return (
    <Show when={props.mc} fallback={<span class={styles.placeholder}> </span>}>
      <Show when={!props.resource.loading} fallback={<LoadingText />}>
        <Show when={props.resource() != null} fallback={<span class={styles.unavail}>unavailable</span>}>
          <span class={styles.val}>{props.resource()}</span>
        </Show>
      </Show>
    </Show>
  );
}

export default function GradlePropertiesPanel(props: {
  form: FormState
  fabricLoaderVersion: Resource<string | null>
  fabricApiVersion: Resource<string | null>
  neoforgeVersion: Resource<string | null>
  forgeVersion: Resource<string | null>
}) {
  const hasFabric = () => needsFabric(props.form);
  const hasNeoforge = () => needsNeoForge(props.form);
  const hasForge = () => needsForge(props.form);
  const defaults = () => deriveDefaults(props.form);

  return (
    <aside class={styles.panel}>
      <div class={styles.header}>gradle.properties</div>
      <div class={styles.body}>
        <PropComment text="Mod Properties" />
        <PropEntry k="mod_name"><StaticVal value={props.form.modName} placeholder={defaults().modName} /></PropEntry>
        <PropEntry k="mod_id"><StaticVal value={props.form.modId} placeholder={defaults().modId} /></PropEntry>
        <PropEntry k="mod_version"><StaticVal value={props.form.modVersion} placeholder={defaults().modVersion} /></PropEntry>
        <PropEntry k="mod_authors"><StaticVal value={props.form.authors} placeholder={defaults().authors} /></PropEntry>
        <PropEntry k="maven_group"><StaticVal value={props.form.projectPackage} placeholder={defaults().projectPackage} /></PropEntry>
        <PropBlank />
        <PropComment text="Dependencies" />
        <PropEntry k="minecraft_version"><StaticVal value={props.form.mcVersion} placeholder={defaults().mcVersion} /></PropEntry>
        <Show when={hasFabric()}>
          <PropEntry k="fabric_loader_version">
            <VersionVal resource={props.fabricLoaderVersion} mc={props.form.mcVersion} />
          </PropEntry>
          <PropEntry k="fabric_version">
            <VersionVal resource={props.fabricApiVersion} mc={props.form.mcVersion} />
          </PropEntry>
        </Show>
        <Show when={hasNeoforge()}>
          <PropEntry k="neoforge_version">
            <VersionVal resource={props.neoforgeVersion} mc={props.form.mcVersion} />
          </PropEntry>
        </Show>
        <Show when={hasForge()}>
          <PropEntry k="forge_version">
            <VersionVal resource={props.forgeVersion} mc={props.form.mcVersion} />
          </PropEntry>
        </Show>
      </div>
    </aside>
  );
}
