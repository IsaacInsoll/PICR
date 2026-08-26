import { stat } from 'node:fs/promises';
import chokidar, { type FSWatcher } from 'chokidar';
import { ignoredPathPattern } from '../../shared/filesystem/ignoredPaths.js';
import type { PingConfig } from './config.js';
import {
  directoriesForEvent,
  type MappedWatchEvent,
  type WatchEventName,
} from './pathMapping.js';

export type WatchCounts = {
  directories: number;
  entries: number;
};

type StartWatcherOptions = {
  config: PingConfig;
  onError: (error: unknown) => void;
  onEvent: (event: WatchEventName, mapped: MappedWatchEvent) => void;
  onReady: (counts: WatchCounts) => void;
};

const watchCounts = (watcher: FSWatcher): WatchCounts => {
  const watched = watcher.getWatched();
  const directories = Object.keys(watched).length;
  const entries = Object.values(watched).reduce(
    (total, directoryEntries) => total + directoryEntries.length,
    0,
  );
  return { directories, entries };
};

export const startWatcher = async ({
  config,
  onError,
  onEvent,
  onReady,
}: StartWatcherOptions): Promise<FSWatcher> => {
  const rootStats = await stat(config.watchRoot);
  if (!rootStats.isDirectory()) {
    throw new Error(`WATCH_ROOT is not a directory: ${config.watchRoot}`);
  }

  const watcher = chokidar.watch(config.watchRoot, {
    alwaysStat: false,
    awaitWriteFinish: {
      pollInterval: Math.min(100, config.stabilityMs),
      stabilityThreshold: config.stabilityMs,
    },
    binaryInterval: config.pollIntervalMs,
    followSymlinks: true,
    ignored: ignoredPathPattern,
    ignoreInitial: true,
    interval: config.pollIntervalMs,
    persistent: true,
    usePolling: config.watchMode === 'polling',
  });

  const handleEvent = (event: WatchEventName, path: string) => {
    try {
      onEvent(
        event,
        directoriesForEvent(event, path, config.watchRoot, config.pathPrefix),
      );
    } catch (error) {
      onError(error);
    }
  };

  watcher
    .on('add', (path) => handleEvent('add', path))
    .on('change', (path) => handleEvent('change', path))
    .on('unlink', (path) => handleEvent('unlink', path))
    .on('addDir', (path) => handleEvent('addDir', path))
    .on('unlinkDir', (path) => handleEvent('unlinkDir', path))
    .on('error', onError)
    .on('ready', () => onReady(watchCounts(watcher)));

  return watcher;
};
