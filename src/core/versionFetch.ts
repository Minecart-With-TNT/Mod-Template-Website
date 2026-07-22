const URL_VERSIONS_MINECRAFT = 'https://piston-meta.mojang.com/mc/game/version_manifest.json';
const URL_VERSIONS_NEOFORGE = 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge';
const URL_VERSIONS_FABRIC = 'https://meta.fabricmc.net/v2/versions/loader/';

type MinecraftVersions = {
  versions: { id: string; type: string }[];
}

type NeoforgeVersions = {
  versions: string[];
}

type FabricLoaderVersions = {loader: { version: string; stable: boolean }}[];

// ===== resolve latest ======

function mcVersionToNeoforgePrefix(mc: string): string {
  const [year, release, patch = '0'] = mc.split('.');
  if (mc.startsWith('1.')) {
    // old scheme: 1.X.Y -> "X.Y." (patch defaults to 0)
    return `${release}.${patch}.`;
  }
  // new calver scheme: X.Y.Z -> "X.Y.Z." (patch defaults to 0, and MUST be included
  // to avoid matching a different, incompatible Minecraft patch release)
  return `${year}.${release}.${patch}.`;
}

// const NEOFORGE_VERSION_PATTERN = /^(\d+\.\d+(\.\d+)?)\.\d(-beta|-alpha\.\d+\+(.*))?$/;

function findLatestNiceVersion(versions: string[]): string | null {
  if (versions.length === 0) return null;

  const latestStable = versions.find(v => !v.endsWith('-beta') && !v.includes('-alpha'));
  if (latestStable !== undefined) {
    return latestStable;
  }
  const latestBeta = versions.find(v => !v.includes('-alpha'));
  if (latestBeta !== undefined) {
    return latestBeta;
  }
  return versions[0]; // latest alpha
}

function resolveLatestNeoforge(neoforgeVersions: NeoforgeVersions | undefined, mc: string): string | null {
  if (neoforgeVersions === undefined) {
    return null;
  }

  // TODO resolve latest versions also for snapshots
  const prefix = mcVersionToNeoforgePrefix(mc);
  const matches = neoforgeVersions.versions.filter(
    v => !v.startsWith('0') && v.startsWith(prefix)
  ).reverse(); // reverse to get newest first

  const latest = findLatestNiceVersion(matches);
  if (latest !== null) {
    return latest;
  }
  const matchesSnapshot = matches.filter(v => v.startsWith('0.' + mc + '.')).reverse();
  const latestSnapshot = findLatestNiceVersion(matchesSnapshot);
  if (latestSnapshot !== null) {
    return latestSnapshot;
  }
  return null;
}

async function resolveLatestFabricLoader(fabricLoaderVersions: FabricLoaderVersions | undefined): Promise<string | null> {
  if (fabricLoaderVersions === undefined) {
    return null;
  }
  const latestStable = fabricLoaderVersions.find(l => l.loader.stable);
  if (latestStable) {
    return latestStable.loader.version;
  }
  const latest = fabricLoaderVersions[0].loader;
  if (latest) {
    return latest.version;
  }
  return null;
}

// ===== fetch ======

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  return await res.json();
}

const MINECRAFT_VERSIONS: Promise<MinecraftVersions> = fetchJson(URL_VERSIONS_MINECRAFT);
const NEOFORGE_VERSIONS: Promise<NeoforgeVersions> = fetchJson(URL_VERSIONS_NEOFORGE);
const FABRIC_VERSIONS: { [mc: string]: Promise<string | null> } = {};

// ===== exports ======

export async function getMinecraftVersions(allowSnapshot: boolean = false): Promise<string[]> {
  return (await MINECRAFT_VERSIONS).versions.filter(v => allowSnapshot || v.type === 'release').map(v => v.id);
}

export async function getNeoforgeVersion(mc: string): Promise<string | null> {
  if (!mc) {
    return null;
  }
  return resolveLatestNeoforge(await NEOFORGE_VERSIONS, mc);
}

export function getFabricLoaderVerison(mc: string): Promise<string | null> {
  if (!mc) {
    return Promise.resolve(null);
  }
  if (!FABRIC_VERSIONS[mc]) {
    FABRIC_VERSIONS[mc] = fetchJson(`${URL_VERSIONS_FABRIC}${encodeURIComponent(mc)}`).then(resolveLatestFabricLoader);
  }
  return FABRIC_VERSIONS[mc];
}