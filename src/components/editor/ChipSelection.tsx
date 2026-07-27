import { For } from 'solid-js';
import { Chip } from './Chip';
import styles from './ChipSelection.module.css';

export type ChipOption<T extends string = string> = {
  id: T,
  label: string,
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
            active={props.value === opt.id}
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
