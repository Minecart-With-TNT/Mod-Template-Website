import { createSignal, createEffect, createResource, onMount, onCleanup, untrack, For, Show, Suspense } from 'solid-js';
import { getMinecraftVersions } from '../core';
import styles from './GradleEditor.module.css';

export function VersionPicker(props: {
  value: string;
  setValue: (v: string) => void;
  onFocus?: () => void;
}) {
  // ── state ──────────────────────────────────────────────────────────────
  const [open, setOpen]           = createSignal(false);
  const [snapshots, setSnapshots] = createSignal(false);
  const [cursor, setCursor]       = createSignal(0);

  let listEl!: HTMLUListElement;
  let wrapperEl!: HTMLDivElement;
  let inputEl!: HTMLInputElement;
  let openOnFocus  = false;  // only open on focus when preceded by a click
  let suppressOpen = false;  // set by Escape; cleared by click or Ctrl+Space

  onMount(() => {
    // Close dropdown when focus moves to any element outside this component.
    // Using focusin (not blur) avoids false-closes from OS IME focus-steals.
    function onDocFocusIn(e: FocusEvent) {
      const t = e.target as Node;
      if (t !== inputEl && !wrapperEl?.contains(t)) setOpen(false);
    }
    document.addEventListener('focusin', onDocFocusIn);
    onCleanup(() => document.removeEventListener('focusin', onDocFocusIn));
  });

  // ── data ───────────────────────────────────────────────────────────────
  const [versions] = createResource(
    () => snapshots() ? 'all' : 'releases',
    mode => getMinecraftVersions(mode === 'all'),
  );

  const options = () => {
    const q   = props.value.toLowerCase().trim();
    const all = versions() ?? [];
    if (!q) return all;
    return all.filter(v => v.includes(q));
  };

  // ── sync ───────────────────────────────────────────────────────────────

  // Keep keyboard cursor on the selected item when options change.
  createEffect(() => {
    const list = options();
    const idx  = list.indexOf(untrack(() => props.value));
    setCursor(idx >= 0 ? idx : 0);
  });

  // Scroll cursor into view by directly manipulating scrollTop.
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

  // ── actions ────────────────────────────────────────────────────────────

  function choose(v: string) {
    props.setValue(v);
    setOpen(false);
  }

  // ── native event handlers (on: prefix = no SolidJS delegation) ─────────

  function onMouseDown() {
    openOnFocus  = true;
    suppressOpen = false;
  }

  function onFocus() {
    props.onFocus?.()
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
    // ── Ctrl+Space: open or toggle snapshots ──────────────────────────
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();  // stop form-level nav handler from seeing this
      suppressOpen = false;
      if (open()) setSnapshots(s => !s);
      else setOpen(true);
      setTimeout(() => inputEl?.focus());
      return;
    }

    // ── Escape: close and suppress re-open until click or Ctrl+Space ──
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      suppressOpen = true;
      return;
    }

    if (!open()) return;  // all remaining keys only apply when dropdown is open

    // ── Space: swallow — prevents OS from sending a stray Space after Ctrl+Space ──
    if (e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // ── Arrow navigation within list ──────────────────────────────────
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

    // ── Enter: select highlighted item ────────────────────────────────
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const item = options()[cursor()];
      if (item) choose(item);
      return;
    }

    // ArrowLeft / ArrowRight: fall through so form-level nav can handle them
  }

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div class={styles.line}>
      <span class={styles.key}>minecraft_version</span>
      <span class={styles.eq}>=</span>
      <span class={styles.editCell}>
        <Suspense fallback={<span class={styles.placeholder}>loading...</span>}>
          <span class={styles.comboWrap}>
            <input
              ref={inputEl}
              type="text"
              class={styles.inlineInput}
              value={props.value}
              placeholder="e.g. 1.21.1"
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
                    {(v, i) => (
                      <li
                        classList={{
                          [styles.activeOption]:      props.value === v,
                          [styles.highlightedOption]: i() === cursor(),
                        }}
                        onmousedown={e => { e.preventDefault(); }}
                        onclick={() => { choose(v); }}
                      >{v}</li>
                    )}
                  </For>
                </ul>
                <div
                  class={styles.dropdownFooter}
                  onmousedown={e => { e.preventDefault(); }}
                  onclick={() => { setSnapshots(s => !s); setTimeout(() => inputEl?.focus()); }}
                >
                  <input type="checkbox" checked={snapshots()} readOnly />
                  <span>Include snapshots</span>
                  <kbd class={styles.kbd}>Ctrl+Space</kbd>
                </div>
              </div>
            </Show>
          </span>
        </Suspense>
      </span>
    </div>
  );
}
