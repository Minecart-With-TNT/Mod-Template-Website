import { type FormState } from './types'

function toSnakeCase(str: string): string {
  return str.toLowerCase().trim().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function deriveDefaults(form: FormState): FormState {
  const result: FormState = { ...form };
  if (!result.modName.trim()) result.modName = 'My Mod';
  if (!result.modId.trim()) result.modId = toSnakeCase(result.modName);
  if (!result.modVersion.trim()) result.modVersion = '1.0.0';
  if (!result.authors.trim()) result.authors = 'Me!';
  if (!result.projectPackage.trim()) {
    const firstAuthor = result.authors.split(',')[0]?.trim();
    const packageName = firstAuthor ? toSnakeCase(firstAuthor) : 'example';
    result.projectPackage = `com.${packageName}.${result.modId.replaceAll('-', '_')}`;
  }
  return result;
}

// NeoForge starts at 1.20.2; older versions use (legacy) Forge
const shouldUseOldForge = (mc: string) => {
  if (!mc) return false;
  if (!mc.startsWith('1.')) return false;
  const [_, minor, patch = '0'] = mc.split('.');
  const minorNum = Number(minor);
  const patchNum = Number(patch);
  return minorNum < 20 || (minorNum === 20 && patchNum < 2);
}

export function needsFabric(form: FormState): boolean {
  return form.loader === 'fabric' || form.loader === 'multiloader'
}

function needForgeOrNeoforge(form: FormState): boolean {
  return form.loader === 'neoforge' || form.loader === 'multiloader';
}

export function needsNeoForge(form: FormState): boolean {
  return needForgeOrNeoforge(form)
    && !shouldUseOldForge(form.mcVersion);
}

export function needsForge(form: FormState): boolean {
  return needForgeOrNeoforge(form)
    && shouldUseOldForge(form.mcVersion);
}
