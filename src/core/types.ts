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

export type SetForm = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

export type SectionHeaderLine = {
  type: 'section-header',
  name: string,
}

export type TextInputLine = {
  type: 'text',
  key: string,
  value: string,
  setValue: (value: string) => void,
  placeholder?: string,
  options?: Promise<{ value: string, flags: number }[]>,
  flagNames?: string[],
}

export type BoolValueLine = {
  type: 'bool',
  key: string,
  value: boolean,
  setValue: (value: boolean) => void,
}

export type SelectValueLine = {
  type: 'select',
  key: string,
  value: string,
  setValue: (value: string) => void,
  options: { id: string, label: string }[],
}

export type ValueLine = {
  type: 'value',
  key: string,
  value: Promise<string | null>,
}

export type Line = SectionHeaderLine | TextInputLine | BoolValueLine | SelectValueLine | ValueLine;
