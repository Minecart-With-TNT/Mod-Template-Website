import { Chip } from './Chip';

export function BoolValue(props: {
  value: boolean,
  onChange: (value: boolean) => void,
  onFocus?: () => void,
}) {
  function onKeyDown(e: KeyboardEvent) {
    const key = e.key.toLowerCase();
    if (key === 't') {
      e.preventDefault();
      props.onChange(true);
    } else if (key === 'f') {
      e.preventDefault();
      props.onChange(false);
    }
  }

  return (
    <Chip
      data-chip-option
      data-active=""
      kind={props.value ? 'true' : 'false'}
      onClick={() => props.onChange(!props.value)}
      onKeyDown={onKeyDown}
      onFocus={props.onFocus}
    >
      {props.value ? 'true' : 'false'}
    </Chip>
  );
}
