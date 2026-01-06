import { Stats } from 'node:fs';

type RenameKind = 'file' | 'dir';

interface PathInfo {
  key: string;
  size?: number;
  mtimeMs?: number;
  birthtimeMs?: number;
}

interface RecentInfo extends PathInfo {
  path: string;
  at: number;
}

const DEFAULT_TTL_MS = 5000;

export const createRenameTracker = (ttlMs: number = DEFAULT_TTL_MS) => {
  const pathInfo = {
    file: new Map<string, PathInfo>(),
    dir: new Map<string, PathInfo>(),
  };

  const recent = {
    file: new Map<string, RecentInfo>(),
    dir: new Map<string, RecentInfo>(),
  };

  const prune = (now: number) => {
    for (const bucket of [recent.file, recent.dir]) {
      for (const [key, info] of bucket) {
        if (now - info.at > ttlMs) bucket.delete(key);
      }
    }
  };

  const makeKey = (kind: RenameKind, stats: Stats): string | null => {
    if (stats.ino && stats.ino > 0) return `ino:${stats.ino}`;
    if (kind === 'dir') return null;
    const birthtimeMs = stats.birthtimeMs ?? 0;
    return `sig:${stats.size}-${stats.mtimeMs}-${birthtimeMs}`;
  };

  const record = (kind: RenameKind, path: string, stats?: Stats) => {
    if (!stats) return;
    const key = makeKey(kind, stats);
    if (!key) return;
    const info: PathInfo = {
      key,
      size: stats.size,
      mtimeMs: stats.mtimeMs,
      birthtimeMs: stats.birthtimeMs,
    };
    pathInfo[kind].set(path, info);
  };

  const markUnlink = (kind: RenameKind, path: string) => {
    const info = pathInfo[kind].get(path);
    pathInfo[kind].delete(path);
    if (!info) return;
    const now = Date.now();
    prune(now);
    recent[kind].set(info.key, { ...info, path, at: now });
  };

  const consumeRename = (
    kind: RenameKind,
    stats?: Stats,
  ): string | undefined => {
    if (!stats) return;
    const key = makeKey(kind, stats);
    if (!key) return;
    const now = Date.now();
    prune(now);
    const match = recent[kind].get(key);
    if (!match) return;
    if (now - match.at > ttlMs) {
      recent[kind].delete(key);
      return;
    }
    recent[kind].delete(key);
    return match.path;
  };

  return {
    record,
    markUnlink,
    consumeRename,
  };
};
