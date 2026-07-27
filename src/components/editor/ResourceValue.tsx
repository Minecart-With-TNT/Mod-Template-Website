import type { Resource } from 'solid-js';
import styles from './common.module.css';

export function ResourceValue(props: { resource: Resource<string | null> }) {
  return <>{
    props.resource.loading
    ? <span class={styles.placeholder}>loading...</span>
    : props.resource()
      ? <span class={styles.val}>{props.resource()!}</span>
      : <span class={styles.placeholder}>unavailable</span>
  }</>;
}
