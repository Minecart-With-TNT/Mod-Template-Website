
export type Loader = 'fabric' | 'neoforge' | 'multiloader';

export type FormState = {
  // mod info
  modName: string,
  modId: string,
  modVersion: string,
  authors: string,
  projectPackage: string,
  license: string,
  // dependencies
  mcVersion: string,
  loader: Loader,
  // template options
  separateClient: boolean,
  useMixin: boolean,
};
