import { createResource, Show } from 'solid-js';
import styles from './common.module.css';

export function PromiseValue(props: { value: Promise<string | null> }) {
  const [resource] = createResource(() => props.value, p => p);

  return (
    <Show
      when={!resource.loading}
      fallback={<span class={styles.placeholder}>loading...</span>}
    >
      <Show
        when={resource()}
        fallback={<span class={styles.placeholder}>unavailable</span>}
      >
        {v => <span class={styles.val}>{v()}</span>}
      </Show>
    </Show>
  );
}
