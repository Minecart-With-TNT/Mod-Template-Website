import type { McVersion } from './versionFetch';

const URL_LICENSES = './licenses.json';

type GithubLicense = {
  key: string,
  spdx_id: string | null,
};

async function fetchLicenses(): Promise<GithubLicense[]> {
  const res = await fetch(URL_LICENSES);
  if (!res.ok) throw new Error(`Licenses fetch failed: ${res.status}`);
  return res.json();
}

const LICENSES: Promise<McVersion[]> = fetchLicenses()
  .then(licenses =>
    licenses.map(l => ({
      value: l.spdx_id ?? l.key,
      flags: 1,
    })),
  )
  .catch(error => {
    console.error('Failed to fetch licenses:', error);
    return [];
  });

export async function getLicenses(): Promise<McVersion[]> {
  return LICENSES;
}
