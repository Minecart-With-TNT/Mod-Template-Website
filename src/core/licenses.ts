import type { McVersion } from './versionFetch';

const URL_LICENSES = 'https://api.github.com/licenses?per_page=100';

type GithubLicense = {
  key: string,
  spdx_id: string | null,
};

async function fetchLicenses(): Promise<GithubLicense[]> {
  const res = await fetch(URL_LICENSES, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2026-03-10',
    },
  });
  if (!res.ok) throw new Error(`GitHub licenses API failed: ${res.status}`);
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
