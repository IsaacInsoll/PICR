import { closeSync, openSync, statSync, unlinkSync, writeSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export interface WriteProbeResult {
  canWrite: boolean;
  errorCode?: string;
  errorMessage?: string;
}

const writeProbePayload = 'picr-write-test\n';

export const probeWriteAccess = (dir: string): WriteProbeResult => {
  const file = path.join(
    dir,
    `.picr-write-test-${process.pid}-${randomUUID()}`,
  );
  let fileDescriptor: number | undefined;
  let created = false;

  try {
    fileDescriptor = openSync(file, 'wx');
    created = true;
    writeSync(fileDescriptor, writeProbePayload);
    closeSync(fileDescriptor);
    fileDescriptor = undefined;
    unlinkSync(file);
    created = false;
    return { canWrite: true };
  } catch (error) {
    if (fileDescriptor !== undefined) {
      try {
        closeSync(fileDescriptor);
      } catch {
        // The original probe error is more useful than a cleanup error.
      }
    }

    if (created) {
      try {
        unlinkSync(file);
      } catch {
        // The original probe error is more useful than a cleanup error.
      }
    }

    const nodeError = error as NodeJS.ErrnoException;
    return {
      canWrite: false,
      errorCode: nodeError.code,
      errorMessage: nodeError.message,
    };
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

export const buildCanWriteWarning = (
  path: string,
  probeResult: WriteProbeResult,
) => {
  const currentRuntimeIdentity = runtimeIdentity();
  const mediaPathOwner = pathOwnerIds(path);
  const mediaPathDetails = pathIdentity(path);
  const composeUserLine = mediaPathOwner
    ? `user: "${mediaPathOwner.uid}:${mediaPathOwner.gid}"`
    : 'user: "<uid>:<gid>"';
  const writeProbeFailure =
    probeResult.errorCode || probeResult.errorMessage
      ? `Write probe failed: ${probeResult.errorCode ?? 'unknown'} ${probeResult.errorMessage ?? ''}`.trim()
      : 'Write probe failed with an unknown error.';

  return [
    `⚠️ CAN_WRITE=true but a write probe to media path '${path}' failed.`,
    `Runtime identity: ${currentRuntimeIdentity}`,
    `Media path owner/mode: ${mediaPathDetails}`,
    writeProbeFailure,
    `Copy/paste into compose.yml under the picr service: ${composeUserLine}`,
    `PICR write actions are disabled (serverInfo.canWrite=false).`,
    `Fix by granting this user write permission on the host path, or set docker compose user to the host media owner UID:GID.`,
    `PICR will still operate perfectly, you just can't move or rename folders.`,
  ].join('\n');
};
