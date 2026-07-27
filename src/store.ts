import { createStore } from 'solid-js/store';
import type { DocId } from './docs';
import { type FormState, deriveDefaults, needsFabric, needsNeoForge, needsForge, getFabricLoaderVerison, getFabricApiVersion, getNeoforgeVersion, getForgeVersion } from './core';
import { createMemo, createResource, createRoot } from 'solid-js';

type State = {
  activeDoc: DocId,
  form: FormState,
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
    license: '',
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

export const {
  getDefaults,
  fabricLoaderVersion,
  fabricApiVersion,
  neoforgeVersion,
  forgeVersion,
} = createRoot(() => {
  const getDefaults = createMemo(() => deriveDefaults(store.form));

  const [fabricLoaderVersion] = createResource(
    () => (needsFabric(getDefaults()) && getDefaults().mcVersion) || undefined,
    getFabricLoaderVerison,
  );
  const [fabricApiVersion] = createResource(
    () => (needsFabric(getDefaults()) && getDefaults().mcVersion) || undefined,
    getFabricApiVersion,
  );
  const [neoforgeVersion] = createResource(
    () => needsNeoForge(getDefaults()) ? getDefaults().mcVersion : undefined,
    getNeoforgeVersion,
  );
  const [forgeVersion] = createResource(
    () => needsForge(getDefaults()) ? getDefaults().mcVersion : undefined,
    getForgeVersion,
  );

  return {
    getDefaults,
    fabricLoaderVersion,
    fabricApiVersion,
    neoforgeVersion,
    forgeVersion,
  };
});
