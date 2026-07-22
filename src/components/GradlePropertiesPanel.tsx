import { createSignal, onCleanup, Show, type Resource } from 'solid-js';
import styles from './GradlePropertiesPanel.module.css';
import type { Loader } from '../core/types';

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

function StaticVal(props: { value: () => string; placeholder?: string }) {
  return (
    <Show when={props.value()} fallback={<span class={styles.placeholder}>{props.placeholder ?? ''}</span>}>
      <span class={styles.val}>{props.value()}</span>
    </Show>
  );
}

function VersionVal(props: { resource: Resource<string | null>; mc: () => string }) {
  return (
    <Show when={props.mc()} fallback={<span class={styles.placeholder}> </span>}>
      <Show when={!props.resource.loading} fallback={<LoadingText />}>
        <Show when={props.resource() != null} fallback={<span class={styles.unavail}>unavailable</span>}>
          <span class={styles.val}>{props.resource()}</span>
        </Show>
      </Show>
    </Show>
  );
}

export default function GradlePropertiesPanel(props: {
  mcVersion: () => string;
  modId: () => string;
  modName: () => string;
  modVersion: () => string;
  authors: () => string;
  loader: () => Loader;
  needsFabric: () => boolean;
  needsNeoForge: () => boolean;
  fabricLoaderVersion: Resource<string | null>;
  fabricApiVersion: Resource<string | null>;
  neoforgeVersion: Resource<string | null>;
}) {
  const mc = props.mcVersion;
  const hasFabric = () => props.loader() === 'fabric' || props.loader() === 'multiloader';
  const hasNeoforge = () => props.loader() === 'neoforge' || props.loader() === 'multiloader';

  return (
    <aside class={styles.panel}>
      <div class={styles.header}>gradle.properties</div>
      <div class={styles.body}>
        <PropComment text="Mod Properties" />
        <PropEntry k="mod_name"><StaticVal value={props.modName} placeholder="My Mod" /></PropEntry>
        <PropEntry k="mod_id"><StaticVal value={props.modId} placeholder="my_mod" /></PropEntry>
        <PropEntry k="mod_version"><StaticVal value={props.modVersion} placeholder="1.0.0" /></PropEntry>
        <PropEntry k="mod_authors"><StaticVal value={props.authors} /></PropEntry>
        <PropBlank />
        <PropComment text="Dependencies" />
        <PropEntry k="minecraft_version"><StaticVal value={mc} /></PropEntry>
        <Show when={hasFabric()}>
          <PropEntry k="loader_version">
            <VersionVal resource={props.fabricLoaderVersion} mc={mc} />
          </PropEntry>
          <PropEntry k="fabric_version">
            <VersionVal resource={props.fabricApiVersion} mc={mc} />
          </PropEntry>
        </Show>

        <Show when={hasNeoforge()}>
          <PropEntry k="neoforge_version">
            <VersionVal resource={props.neoforgeVersion} mc={mc} />
          </PropEntry>
        </Show>
      </div>
    </aside>
  );
}
