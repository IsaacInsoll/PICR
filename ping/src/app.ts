import {
  closeHealthServer,
  startHealthServer,
  type PingHealthState,
} from './healthServer.js';
import { createDirectoryBatcher } from './batcher.js';
import { configFromEnv, type PingConfig } from './config.js';
import { logger, type PingLogger } from './logger.js';
import { fatalBanner, startupBanner } from './pingBanner.js';
import { startWatcher } from './watcher.js';

const MAX_DIRECTORIES = 1000;
const ROLLUP_MS = 60_000;

const isInotifyLimitError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const code = 'code' in error ? String(error.code) : '';
  return code === 'ENOSPC' || code === 'EMFILE';
};

export const run = async (
  config: PingConfig,
  pingLogger: PingLogger = logger,
) => {
  if (!config.dryRun) {
    throw new Error(
      'PICR delivery is not available yet; start with DRY_RUN=true',
    );
  }

  pingLogger.banner(startupBanner(config));
  const healthState: PingHealthState = { watcherReady: false };
  const healthServer = await startHealthServer(config.healthPort, healthState);
  let detectedEvents = 0;
  let sentDirectories = 0;
  let shuttingDown = false;

  const batcher = createDirectoryBatcher({
    batchMs: config.batchMs,
    maxDirectories: MAX_DIRECTORIES,
    onFlush: (directories) => {
      sentDirectories += directories.length;
      pingLogger.log(
        'info',
        `DRY RUN would send ${directories.length} director${directories.length === 1 ? 'y' : 'ies'}: ${JSON.stringify(directories)}`,
      );
    },
  });

  const resources: {
    rollupTimer?: ReturnType<typeof setInterval>;
    watcher?: Awaited<ReturnType<typeof startWatcher>>;
  } = {};

  const shutdown = async (exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (resources.rollupTimer) clearInterval(resources.rollupTimer);
    await resources.watcher?.close();
    await batcher.close();
    await closeHealthServer(healthServer);
    process.exitCode = exitCode;
  };

  const fail = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const actionable = isInotifyLimitError(error)
      ? `${message}. Increase both fs.inotify.max_user_watches and fs.inotify.max_user_instances on the NAS.`
      : message;
    healthState.fatalError = actionable;
    pingLogger.banner(fatalBanner(config, actionable));
    void shutdown(1);
  };

  resources.watcher = await startWatcher({
    config,
    onError: fail,
    onEvent: (event, mapped) => {
      detectedEvents += 1;
      if (config.verbose || config.dryRun) {
        pingLogger.log(
          'info',
          `${event} → ${JSON.stringify(mapped.directories)}`,
        );
      }
      batcher.add(
        mapped.directories,
        mapped.unlinkDerived ? config.stabilityMs + config.batchMs : 0,
      );
    },
    onReady: (counts) => {
      healthState.watcherReady = true;
      pingLogger.log(
        'info',
        `✔ Watching ${counts.directories.toLocaleString('en')} directories · ${counts.entries.toLocaleString('en')} entries`,
      );
    },
  });

  resources.rollupTimer = setInterval(() => {
    pingLogger.log(
      'info',
      `DRY RUN active · ${detectedEvents} events detected · ${sentDirectories} directory hints logged · ${batcher.pendingCount()} pending`,
    );
  }, ROLLUP_MS);
  resources.rollupTimer.unref();

  const signalHandler = () => {
    void shutdown();
  };
  process.once('SIGINT', signalHandler);
  process.once('SIGTERM', signalHandler);

  return { batcher, healthServer, shutdown, watcher: resources.watcher };
};

const main = async () => {
  let config: PingConfig | undefined;
  try {
    config = configFromEnv(process.env);
    await run(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (config) logger.banner(fatalBanner(config, message));
    else logger.log('error', message);
    process.exitCode = 1;
  }
};

await main();
