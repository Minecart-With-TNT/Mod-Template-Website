import { type JSX, splitProps } from 'solid-js';
import styles from './Chip.module.css';

export type ChipKind = 'true' | 'false' | 'dull' | 'accent';

type ChipProps = {
  kind: ChipKind,
  type?: 'button' | 'submit',
  children?: JSX.Element,
  class?: string,
} & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'class' | 'children'>;

export function Chip(props: ChipProps) {
  const [local, rest] = splitProps(props, ['kind', 'type', 'children', 'class']);

  return (
    <button
      {...rest}
      type={local.type ?? 'button'}
      classList={{
        [styles.chip]: true,
        [styles[local.kind]]: true,
        [local.class!]: !!local.class,
      }}
    >
      {local.children}
    </button>
  );
}
