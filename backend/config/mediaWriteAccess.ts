import { accessSync, constants, statSync } from 'node:fs';

export const testWriteAccess = (path: string): boolean => {
  try {
    accessSync(path, constants.R_OK | constants.W_OK);
    return true;
  } catch {
    return false;
  }
};

export const runtimeIdentity = () => {
  const uid =
    typeof process.getuid === 'function' ? process.getuid() : 'unknown';
  const gid =
    typeof process.getgid === 'function' ? process.getgid() : 'unknown';
  return `uid=${uid} gid=${gid}`;
};

export const pathIdentity = (path: string) => {
  try {
    const stats = statSync(path);
    const mode = (stats.mode & 0o777).toString(8).padStart(3, '0');
    return `uid=${stats.uid} gid=${stats.gid} mode=${mode}`;
  } catch {
    return 'unknown';
  }
};

export const pathOwnerIds = (path: string) => {
  try {
    const stats = statSync(path);
    return { uid: stats.uid, gid: stats.gid };
  } catch {
    return undefined;
  }
};

export const buildCanWriteWarning = (path: string) => {
  const currentRuntimeIdentity = runtimeIdentity();
  const mediaPathOwner = pathOwnerIds(path);
  const mediaPathDetails = pathIdentity(path);
  const composeUserLine = mediaPathOwner
    ? `user: "${mediaPathOwner.uid}:${mediaPathOwner.gid}"`
    : 'user: "<uid>:<gid>"';

  return [
    `⚠️ CAN_WRITE=true but no write access to media path '${path}'.`,
    `Runtime identity: ${currentRuntimeIdentity}`,
    `Media path owner/mode: ${mediaPathDetails}`,
    `Copy/paste into compose.yml under the picr service: ${composeUserLine}`,
    `PICR write actions are disabled (serverInfo.canWrite=false).`,
    `Fix by granting this user write permission on the host path, or set docker compose user to the host media owner UID:GID.`,
    `PICR will still operate perfectly, you just can't move or rename folders.`,
  ].join('\n');
};
