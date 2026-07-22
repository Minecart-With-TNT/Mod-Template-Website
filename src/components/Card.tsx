import type { JSX } from 'solid-js'
import styles from './Card.module.css'

export default function Card(props: { title: string; children: JSX.Element }) {
  return (
    <div class={styles.card}>
      <div class={styles.header}>{props.title}</div>
      {props.children}
    </div>
  )
}
