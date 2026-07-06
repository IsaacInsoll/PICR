import { lt, valid } from 'semver';
import type { ServerOptionsFields } from '../db/picrDb.js';
import { log } from '../logger.js';

export const assertDatabaseVersionCompatible = (
  opts: Pick<ServerOptionsFields, 'lastBootedVersion' | 'minimumPicrVersion'>,
  currentVersion?: string | null,
) => {
  const minimumVersion = opts.minimumPicrVersion;
  const currentIsValid = Boolean(currentVersion && valid(currentVersion));

  if (minimumVersion && !valid(minimumVersion)) {
    log(
      'warn',
      `⚠️ Ignoring invalid minimum PICR version stored in database: ${minimumVersion}`,
      true,
    );
  }

  if (minimumVersion && valid(minimumVersion) && !currentIsValid) {
    log(
      'warn',
      `⚠️ Database requires PICR ${minimumVersion} or newer, but current PICR version is not semver-valid: ${String(
        currentVersion,
      )}`,
      true,
    );
    return;
  }

  if (
    currentVersion &&
    minimumVersion &&
    valid(minimumVersion) &&
    lt(currentVersion, minimumVersion)
  ) {
    throw new Error(
      `This PICR database requires PICR ${minimumVersion} or newer. Current version is ${currentVersion}. Start PICR with a newer image.`,
    );
  }

  const lastBootedVersion = opts.lastBootedVersion;
  if (
    currentVersion &&
    lastBootedVersion &&
    valid(lastBootedVersion) &&
    currentIsValid &&
    lt(currentVersion, lastBootedVersion)
  ) {
    const floor =
      minimumVersion && valid(minimumVersion)
        ? `minimum supported version is ${minimumVersion}`
        : 'no minimum version is set';
    log(
      'warn',
      `⚠️ Database was last booted by PICR ${lastBootedVersion}; current PICR ${currentVersion} is older, but supported (${floor}). Continuing.`,
      true,
    );
  }
};
