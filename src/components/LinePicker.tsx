import { createSignal, createEffect, onMount, onCleanup, untrack, For, Show, type Resource } from 'solid-js';
import type { McVersion } from '../core';
import styles from './GradleEditor.module.css';

const DEFAULT_FLAGS = ['Releases', 'Snapshots'];

export function LinePicker(props: {
  propKey: string;
  value: string;
  setValue: (v: string) => void;
  onFocus?: () => void;
  items: Resource<McVersion[]>;
  flags?: string[];
  placeholder?: string;
}) {
  const flagsArr = () => props.flags ?? DEFAULT_FLAGS;

  const [open, setOpen]           = createSignal(false);
  const [flagIndex, setFlagIndex] = createSignal(0);
  const [cursor, setCursor]       = createSignal(0);

  let listEl!: HTMLUListElement;
  let wrapperEl!: HTMLDivElement;
  let inputEl!: HTMLInputElement;
  let openOnFocus  = false;
  let suppressOpen = false;

  onMount(() => {
    function onDocFocusIn(e: FocusEvent) {
      const t = e.target as Node;
      if (t !== inputEl && !wrapperEl?.contains(t)) setOpen(false);
    }
    document.addEventListener('focusin', onDocFocusIn);
    onCleanup(() => document.removeEventListener('focusin', onDocFocusIn));
  });

  const options = () => {
    const q       = props.value.toLowerCase().trim();
    const all     = props.items() ?? [];
    const mask    = 1 << flagIndex();
    const visible = all.filter(item => (item.flags & mask) !== 0);
    if (!q) return visible;
    return visible.filter(item => item.value.includes(q));
  };

  createEffect(() => {
    const list = options();
    const idx  = list.findIndex(item => item.value === untrack(() => props.value));
    setCursor(idx >= 0 ? idx : 0);
  });

  createEffect(() => {
    const idx = cursor();
    if (!open()) return;
    requestAnimationFrame(() => {
      if (!listEl) return;
      const item = listEl.querySelectorAll<HTMLLIElement>('li')[idx];
      if (!item) return;
      const top    = item.offsetTop;
      const bottom = top + item.offsetHeight;
      if (bottom > listEl.scrollTop + listEl.clientHeight)
        listEl.scrollTop = bottom - listEl.clientHeight;
      else if (top < listEl.scrollTop)
        listEl.scrollTop = top;
    });
  });

  function choose(v: string) {
    props.setValue(v);
    setOpen(false);
  }

  function onMouseDown() {
    openOnFocus  = true;
    suppressOpen = false;
  }

  function onFocus() {
    props.onFocus?.();
    if (openOnFocus) {
      openOnFocus = false;
      setOpen(true);
    }
  }

  function onInput(e: Event) {
    props.setValue((e.target as HTMLInputElement).value);
    if (!suppressOpen) setOpen(true);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      suppressOpen = false;
      if (open()) setFlagIndex(i => (i + 1) % flagsArr().length);
      else setOpen(true);
      setTimeout(() => inputEl?.focus());
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      suppressOpen = true;
      return;
    }

    if (!open()) return;

    if (e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setCursor(i => Math.min(i + 1, options().length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setCursor(i => Math.max(i - 1, 0));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const item = options()[cursor()];
      if (item) choose(item.value);
      return;
    }
  }

  return (
    <div class={styles.line}>
      <span class={styles.key}>{props.propKey}</span>
      <span class={styles.eq}>=</span>
      <span class={styles.editCell}>
        <Show
          when={!props.items.loading}
          fallback={<span class={styles.placeholder}>loading...</span>}
        >
          <span class={styles.comboWrap}>
            <input
              ref={inputEl}
              type="text"
              class={styles.inlineInput}
              value={props.value}
              placeholder={props.placeholder}
              autocomplete="off"
              spellcheck={false}
              on:mousedown={onMouseDown}
              on:focus={onFocus}
              on:input={onInput}
              on:keydown={onKeyDown}
            />
            <Show when={open()}>
              <div ref={wrapperEl} class={styles.dropdownWrap}>
                <ul ref={listEl} class={styles.dropdown}>
                  <For each={options()}>
                    {(item, i) => (
                      <li
                        classList={{
                          [styles.activeOption]:      props.value === item.value,
                          [styles.highlightedOption]: i() === cursor(),
                        }}
                        onmousedown={e => { e.preventDefault(); }}
                        onclick={() => { choose(item.value); }}
                      >{item.value}</li>
                    )}
                  </For>
                </ul>
                <div
                  class={styles.dropdownFooter}
                  onmousedown={e => { e.preventDefault(); }}
                  onclick={() => {
                    setFlagIndex(i => (i + 1) % flagsArr().length);
                    setTimeout(() => inputEl?.focus());
                  }}
                >
                  <span>{flagsArr()[flagIndex()]}</span>
                  <kbd class={styles.kbd}>Ctrl+Space</kbd>
                </div>
              </div>
            </Show>
          </span>
        </Show>
      </span>
    </div>
  );
}
