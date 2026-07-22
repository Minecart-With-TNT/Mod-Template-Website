import { type FormState } from './types'

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
