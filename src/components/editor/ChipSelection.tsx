import { For } from 'solid-js';
import { Chip, type ChipKind } from './Chip';
import styles from './ChipSelection.module.css';

type ChipOption<T extends string = string> = {
  id: T,
  label: string,
  /** Kind used when this option is selected. Defaults to `accent`. */
  kind?: ChipKind,
};

export function ChipSelection<T extends string>(props: {
  value: T,
  options: ChipOption<T>[],
  onChange: (value: T) => void,
  onFocus?: () => void,
}) {
  return (
    <span class={styles.chipGroup} data-chip-selection>
      <For each={props.options}>
        {opt => (
          <Chip
            data-chip-option
            data-active={props.value === opt.id ? '' : undefined}
            kind={props.value === opt.id ? (opt.kind ?? 'accent') : 'dull'}
            onClick={() => props.onChange(opt.id)}
            onFocus={props.onFocus}
          >
            {opt.label}
          </Chip>
        )}
      </For>
    </span>
  );
}
