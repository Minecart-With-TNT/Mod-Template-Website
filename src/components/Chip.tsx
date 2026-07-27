import { type JSX, splitProps } from 'solid-js'
import styles from './Chip.module.css'

export type ChipProps = {
  active?: boolean
  type?: 'button' | 'submit'
  children?: JSX.Element
  class?: string
} & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'class' | 'children'>

export function Chip(props: ChipProps) {
  const [local, rest] = splitProps(props, ['active', 'type', 'children', 'class'])

  return (
    <button
      {...rest}
      type={local.type ?? 'button'}
      classList={{
        [styles.chip]: true,
        [styles.active]: !!local.active,
        [local.class!]: !!local.class,
      }}
    >
      {local.children}
    </button>
  )
}
