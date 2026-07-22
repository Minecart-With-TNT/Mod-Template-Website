
export type Loader = 'fabric' | 'neoforge' | 'multiloader';

export type FormState = {
  // mod info
  modName: string;
  modId: string;
  modVersion: string;
  authors: string;
  projectPackage: string;
  // dependencies
  mcVersion: string;
  loader: Loader;
}