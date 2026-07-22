const URL_VERSIONS_MINECRAFT = 'https://piston-meta.mojang.com/mc/game/version_manifest.json';
const URL_VERSIONS_NEOFORGE = 'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge';
const URL_VERSIONS_FORGE = './forge_versions.json';
const URL_VERSIONS_FABRIC = 'https://meta.fabricmc.net/v2/versions/loader/';
const URL_VERSIONS_FABRIC_API = 'https://api.modrinth.com/v2/project/P7dR8mSH/version';

type MinecraftVersions = {
  versions: { id: string; type: string }[];
}

type NeoforgeVersions = {
  versions: string[];
}

type ForgePromotions = { promos: Record<string, string> };

type FabricLoaderVersions = {loader: { version: string; stable: boolean }}[];

type ModrinthVersionEntry = { version_number: string };

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

const MINECRAFT_VERSIONS: Promise<MinecraftVersions> = fetchJson(URL_VERSIONS_MINECRAFT).catch(error => {
  console.error('Failed to fetch Minecraft versions:', error);
  return { versions: [] };
});
const NEOFORGE_VERSIONS: Promise<NeoforgeVersions> = fetchJson(URL_VERSIONS_NEOFORGE).catch(error => {
  console.error('Failed to fetch NeoForge versions:', error);
  return { versions: [] };
});
const FORGE_PROMOTIONS: Promise<ForgePromotions> = fetchJson(URL_VERSIONS_FORGE).catch(error => {
  console.error('Failed to fetch Forge promotions:', error);
  return { promos: {} };
});
const FABRIC_VERSIONS: { [mc: string]: Promise<string | null> } = {};
const FABRIC_API_VERSIONS: { [mc: string]: Promise<string | null> } = {};

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

export async function getForgeVersion(mc: string): Promise<string | null> {
  if (!mc) return null;
  const { promos } = await FORGE_PROMOTIONS;
  const build = promos[`${mc}-recommended`] ?? promos[`${mc}-latest`] ?? null;
  return build ? `${mc}-${build}` : null;
}

export async function getFabricLoaderVerison(mc: string): Promise<string | null> {
  if (!mc) {
    return Promise.resolve(null);
  }
  if (!(await MINECRAFT_VERSIONS).versions.find(v => v.id === mc)) {
    return Promise.resolve(null);
  }
  return await getFabricLoaderVerisonUnsafe(mc);
}

export function getFabricLoaderVerisonUnsafe(mc: string): Promise<string | null> {
  if (!FABRIC_VERSIONS[mc]) {
    FABRIC_VERSIONS[mc] = fetchJson(`${URL_VERSIONS_FABRIC}${encodeURIComponent(mc)}`).then(resolveLatestFabricLoader).catch(error => {
      console.error('Failed to resolve Fabric loader for Minecraft version:', mc, error);
      return null;
    });
  }
  return FABRIC_VERSIONS[mc];
}

export async function getFabricApiVersion(mc: string): Promise<string | null> {
  if (!mc) return Promise.resolve(null);
  if (!(await MINECRAFT_VERSIONS).versions.find(v => v.id === mc)) {
    return Promise.resolve(null);
  }
  return await getFabricApiVersionUnsafe(mc);
}

function getFabricApiVersionUnsafe(mc: string): Promise<string | null> {
  if (!FABRIC_API_VERSIONS[mc]) {
    const params = new URLSearchParams();
    params.set('game_versions', JSON.stringify([mc]));
    params.set('loaders', JSON.stringify(['fabric']));
    FABRIC_API_VERSIONS[mc] = fetchJson(`${URL_VERSIONS_FABRIC_API}?${params}`)
      .then((versions: ModrinthVersionEntry[]) => versions?.[0]?.version_number ?? null)
      .catch(error => {
        console.error('Failed to fetch Fabric API versions for Minecraft version:', mc, error);
        return null;
      });
  }
  return FABRIC_API_VERSIONS[mc];
}
