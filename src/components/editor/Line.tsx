import { type JSX, Show } from 'solid-js';
import styles from './Line.module.css';

export type LineProps = {
  comment?: string,
  key?: string,
  class?: string,
  children?: JSX.Element,
};

export function Line(props: LineProps) {
  return (
    <div class={`${styles.line}${props.class ? ` ${props.class}` : ''}`}>
      <Show when={props.comment}>
        <span class={styles.comment}># {props.comment}</span>
      </Show>
      <Show when={props.key}>
        <span class={styles.key}>{props.key}</span>
        <span class={styles.eq}>=</span>
      </Show>
      {props.children}
    </div>
  );
}
