import { createSignal, createEffect, onMount, onCleanup, untrack, For, Show, type Resource, type JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import type { McVersion } from '../../core';
import common from './common.module.css';
import styles from './ValuePicker.module.css';

const DROPDOWN_GAP = 4;
const DROPDOWN_MAX = 300;
const VIEWPORT_PAD = 8;

function viewportBounds() {
  const vv = window.visualViewport;
  if (vv) {
    return {
      top: vv.offsetTop,
      bottom: vv.offsetTop + vv.height,
    };
  }
  return { top: 0, bottom: window.innerHeight };
}

export function ValuePicker(props: {
  value: string,
  setValue: (v: string) => void,
  onFocus?: () => void,
  items: Resource<McVersion[]>,
  flags?: string[],
  placeholder?: string,
}) {
  const flagsArr = () => props.flags;
  const hasFlagFilter = () => (flagsArr()?.length ?? 0) > 0;

  const [open, setOpen]           = createSignal(false);
  const [flagIndex, setFlagIndex] = createSignal(0);
  const [cursor, setCursor]       = createSignal(0);
  const [dropdownStyle, setDropdownStyle] = createSignal<JSX.CSSProperties>({});

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

  function updatePosition() {
    if (!inputEl) return;
    const vp = viewportBounds();
    const rect = inputEl.getBoundingClientRect();
    const spaceBelow = vp.bottom - rect.bottom - DROPDOWN_GAP - VIEWPORT_PAD;
    const spaceAbove = rect.top - vp.top - DROPDOWN_GAP - VIEWPORT_PAD;

    // Prefer the side that can fit the ideal height; otherwise the roomier side.
    const placeBelow =
      spaceBelow >= DROPDOWN_MAX ? true :
      spaceAbove >= DROPDOWN_MAX ? false :
      spaceBelow >= spaceAbove;

    const maxH = Math.min(DROPDOWN_MAX, Math.max(0, placeBelow ? spaceBelow : spaceAbove));

    if (placeBelow) {
      setDropdownStyle({
        top: `${rect.bottom + DROPDOWN_GAP}px`,
        bottom: 'auto',
        left: `${rect.left}px`,
        '--dropdown-max-height': `${maxH}px`,
      });
    } else {
      setDropdownStyle({
        top: 'auto',
        bottom: `${window.innerHeight - rect.top + DROPDOWN_GAP}px`,
        left: `${rect.left}px`,
        '--dropdown-max-height': `${maxH}px`,
      });
    }
  }

  createEffect(() => {
    if (!open()) return;
    updatePosition();
    // Remeasure after paint once the portal content has real height.
    const raf = requestAnimationFrame(() => updatePosition());
    const onReposition = () => updatePosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    window.visualViewport?.addEventListener('resize', onReposition);
    window.visualViewport?.addEventListener('scroll', onReposition);
    onCleanup(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
      window.visualViewport?.removeEventListener('resize', onReposition);
      window.visualViewport?.removeEventListener('scroll', onReposition);
    });
  });

  const options = () => {
    const q   = props.value.toLowerCase().trim();
    const all = props.items() ?? [];
    const flags = flagsArr();
    const visible = flags?.length
      ? all.filter(item => (item.flags & (1 << flagIndex())) !== 0)
      : all;
    if (!q) return visible;
    return visible.filter(item => item.value.toLowerCase().includes(q));
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

  function openDropdown() {
    updatePosition();
    setOpen(true);
  }

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
      openDropdown();
    }
  }

  function onInput(e: Event) {
    props.setValue((e.target as HTMLInputElement).value);
    if (!suppressOpen) openDropdown();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      suppressOpen = false;
      const flags = flagsArr();
      if (flags && flags.length > 1 && open()) setFlagIndex(i => (i + 1) % flags.length);
      else openDropdown();
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
    <span class={common.editCell}>
      <Show
        when={!props.items.loading}
        fallback={<span class={common.placeholder}>loading...</span>}
      >
        <span class={styles.comboWrap}>
          <input
            ref={inputEl}
            type="text"
            class={common.inlineInput}
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
            <Portal>
              <div ref={wrapperEl} class={styles.dropdownWrap} style={dropdownStyle()}>
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
                <Show when={hasFlagFilter()}>
                  <div
                    class={styles.dropdownFooter}
                    onmousedown={e => { e.preventDefault(); }}
                    onclick={() => {
                      const flags = flagsArr()!;
                      setFlagIndex(i => (i + 1) % flags.length);
                      setTimeout(() => inputEl?.focus());
                    }}
                  >
                    <span>{flagsArr()![flagIndex()]}</span>
                    <kbd class={styles.kbd}>Ctrl+Space</kbd>
                  </div>
                </Show>
              </div>
            </Portal>
          </Show>
        </span>
      </Show>
    </span>
  );
}
