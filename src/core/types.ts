
export type Loader = 'fabric' | 'neoforge' | 'multiloader';

export type FormState = {
  mcVersion: string
  modName: string
  modId: string
  modVersion: string
  authors: string
  loader: Loader
}