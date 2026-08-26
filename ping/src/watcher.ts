import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { ignoredPathPattern } from '../../shared/filesystem/ignoredPaths.js';
import type { PingConfig } from './config.js';
import {
  directoriesForEvent,
  mediaPathFor,
  type MappedWatchEvent,
  type WatchEventName,
} from './pathMapping.js';

export type WatchCounts = {
  directories: number;
  entries: number;
  sampleFile?: string;
};

type StartWatcherOptions = {
  config: PingConfig;
  onError: (error: unknown) => void;
  onEvent: (event: WatchEventName, mapped: MappedWatchEvent) => void;
  onPathError: (error: unknown) => void;
  onReady: (counts: WatchCounts) => Promise<void> | void;
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

const sampleVisibleFile = async (
  watcher: FSWatcher,
  config: PingConfig,
): Promise<string | undefined> => {
  for (const [directory, entries] of Object.entries(watcher.getWatched())) {
    for (const entry of entries) {
      const path = join(directory, entry);
      try {
        if ((await stat(path)).isFile()) {
          return mediaPathFor(path, config.watchRoot, config.pathPrefix);
        }
      } catch {
        // The tree can change while the startup sample is selected. Try another entry.
      }
    }
  }
  return undefined;
};

export const startWatcher = async ({
  config,
  onError,
  onEvent,
  onPathError,
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
      onPathError(error);
    }
  };

  watcher
    .on('add', (path) => handleEvent('add', path))
    .on('change', (path) => handleEvent('change', path))
    .on('unlink', (path) => handleEvent('unlink', path))
    .on('addDir', (path) => handleEvent('addDir', path))
    .on('unlinkDir', (path) => handleEvent('unlinkDir', path))
    .on('error', onError)
    .on('ready', () => {
      void sampleVisibleFile(watcher, config)
        .then((sampleFile) => onReady({ ...watchCounts(watcher), sampleFile }))
        .catch(onError);
    });

  return watcher;
};
