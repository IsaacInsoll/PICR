type ParsedVersion = readonly [number, number, number];

const parseVersion = (version: string): ParsedVersion | null => {
  const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

export const isNewerPicrVersion = (
  latest: string,
  current: string,
): boolean => {
  const latestVersion = parseVersion(latest);
  const currentVersion = parseVersion(current);
  if (!latestVersion || !currentVersion) return false;

  for (let i = 0; i < latestVersion.length; i += 1) {
    if (latestVersion[i] > currentVersion[i]) return true;
    if (latestVersion[i] < currentVersion[i]) return false;
  }
  return false;
};
