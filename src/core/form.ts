import type { FormState, Line, Loader, SetForm } from './types';
import { deriveDefaults, needsFabric, needsForge, needsNeoForge } from './utils';
import {
  getFabricApiVersion,
  getFabricLoaderVerison,
  getForgeVersion,
  getMinecraftVersions,
  getNeoforgeVersion,
} from './versionFetch';
import { getLicenses } from './licenses';

const LOADERS: { id: Loader, label: string }[] = [
  { id: 'fabric',       label: 'Fabric'      },
  { id: 'neoforge',    label: 'NeoForge'    },
  { id: 'multiloader', label: 'Multiloader' },
];

function sanitizeModId(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
}

export function getFormLines(form: FormState, setForm: SetForm): Line[] {
  const defaults = deriveDefaults(form);
  const lines: Line[] = [
    { type: 'section-header', name: 'Mod Properties' },
    { type: 'text', key: 'mod_name', value: form.modName, placeholder: defaults.modName, setValue: v => setForm('modName', v) },
    { type: 'text', key: 'mod_id', value: form.modId, placeholder: defaults.modId, setValue: v => setForm('modId', sanitizeModId(v)) },
    { type: 'text', key: 'mod_version', value: form.modVersion, placeholder: defaults.modVersion, setValue: v => setForm('modVersion', v) },
    { type: 'text', key: 'mod_authors', value: form.authors, placeholder: defaults.authors, setValue: v => setForm('authors', v) },
    { type: 'text', key: 'maven_group', value: form.projectPackage, placeholder: defaults.projectPackage, setValue: v => setForm('projectPackage', v) },
    { type: 'text', key: 'license', value: form.license, placeholder: 'none', setValue: v => setForm('license', v), options: getLicenses() },
    { type: 'section-header', name: 'Dependencies' },
    {
      type: 'text',
      key: 'minecraft_version',
      value: form.mcVersion,
      placeholder: defaults.mcVersion,
      setValue: v => setForm('mcVersion', v),
      options: getMinecraftVersions(),
      flagNames: ['Releases', 'Snapshots'],
    },
    {
      type: 'select',
      key: 'mod_loader',
      value: form.loader,
      setValue: v => setForm('loader', v as Loader),
      options: LOADERS,
    },
  ];

  if (needsFabric(defaults)) {
    lines.push(
      { type: 'value', key: 'fabric_loader_version', value: getFabricLoaderVerison(defaults.mcVersion) },
      { type: 'value', key: 'fabric_api_version', value: getFabricApiVersion(defaults.mcVersion) },
    );
  }
  if (needsNeoForge(defaults)) {
    lines.push(
      { type: 'value', key: 'neoforge_version', value: getNeoforgeVersion(defaults.mcVersion) },
    );
  }
  if (needsForge(defaults)) {
    lines.push(
      { type: 'value', key: 'forge_version', value: getForgeVersion(defaults.mcVersion) },
    );
  }

  lines.push(
    { type: 'section-header', name: 'Template Options' },
    {
      type: 'bool',
      key: 'separate_client',
      value: form.separateClient,
      setValue: v => setForm('separateClient', v),
    },
    {
      type: 'bool',
      key: 'use_mixin',
      value: form.useMixin,
      setValue: v => setForm('useMixin', v),
    },
  );

  return lines;
}
