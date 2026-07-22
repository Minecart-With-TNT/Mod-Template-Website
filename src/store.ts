import { createStore } from 'solid-js/store'
import type { DocId } from './docs'
import { type FormState, deriveDefaults } from './core'
import { createMemo, createRoot } from 'solid-js';

type State = {
  activeDoc: DocId;
  form: FormState;
};

const [store, setStore] = createStore<State>({
  activeDoc: 'welcome',
  form: {
    mcVersion: '',
    modName: '',
    modId: '',
    modVersion: '',
    authors: '',
    loader: 'fabric',
    projectPackage: '',
  },
});

export function setCurrentDoc(docId: DocId) {
  setStore('activeDoc', docId);
}

export function getCurrentDoc(): DocId {
  return store.activeDoc;
}

export function getForm(): FormState {
  return store.form;
}

export function updateForm(key: keyof FormState, value: FormState[keyof FormState]) {
  setStore('form', key, value);
}

export const { getDefaults } = createRoot(() => {
  const getDefaults = createMemo(() => deriveDefaults(store.form));
  return {
    getDefaults
  };
});

