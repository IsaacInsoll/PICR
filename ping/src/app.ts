import {
  closeHealthServer,
  startHealthServer,
  type PingHealthState,
} from './healthServer.js';
import { createDirectoryBatcher } from './batcher.js';
import { configFromEnv, type PingConfig } from './config.js';
import { createDeliveryService } from './delivery.js';
import { logger, type PingLogger } from './logger.js';
import { fatalBanner, startupBanner } from './pingBanner.js';
import {
  createProtocolContext,
  MAX_DIRECTORIES,
  MAX_REQUEST_BYTES,
  payloadBytes,
} from './protocol.js';
import { startWatcher } from './watcher.js';

const ROLLUP_MS = 60_000;
const HEARTBEAT_MS = 60_000;

const isInotifyLimitError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const code = 'code' in error ? String(error.code) : '';
  return code === 'ENOSPC' || code === 'EMFILE';
};

export const run = async (
  config: PingConfig,
  pingLogger: PingLogger = logger,
) => {
  pingLogger.banner(startupBanner(config));
  const healthState: PingHealthState = { watcherReady: false };
  const healthServer = await startHealthServer(config.healthPort, healthState);
  const protocol = createProtocolContext({ config });
  const delivery = config.dryRun
    ? undefined
    : createDeliveryService({
        config,
        logger: pingLogger,
        onPermanentError: (message) => {
          healthState.permanentDeliveryError = message;
        },
        protocol,
      });
  let detectedEvents = 0;
  let sentDirectories = 0;
  let shuttingDown = false;

  const batcher = createDirectoryBatcher({
    batchMs: config.batchMs,
    maxBytes: MAX_REQUEST_BYTES,
    maxDirectories: MAX_DIRECTORIES,
    measureBytes: (directories) =>
      payloadBytes(protocol.changePayload(directories)),
    onFlush: (directories) => {
      sentDirectories += directories.length;
      if (config.dryRun) {
        pingLogger.log(
          'info',
          `DRY RUN would send ${directories.length} director${directories.length === 1 ? 'y' : 'ies'}: ${JSON.stringify(directories)}`,
        );
      } else {
        delivery?.enqueueDirectories(directories);
      }
    },
  });

  const resources: {
    heartbeatTimer?: ReturnType<typeof setInterval>;
    rollupTimer?: ReturnType<typeof setInterval>;
    watcher?: Awaited<ReturnType<typeof startWatcher>>;
  } = {};

  const shutdown = async (exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (resources.heartbeatTimer) clearInterval(resources.heartbeatTimer);
    if (resources.rollupTimer) clearInterval(resources.rollupTimer);
    await resources.watcher?.close();
    const { heldDirectories } = await batcher.close();
    if (heldDirectories.length > 0) {
      if (config.dryRun) {
        pingLogger.log(
          'info',
          `DRY RUN shutdown would force a reconcile for ${config.pathPrefix || '<media root>'} to preserve ${heldDirectories.length} held deletion hint(s)`,
        );
      } else if (exitCode === 0) {
        pingLogger.log(
          'info',
          `Shutdown is preserving ${heldDirectories.length} held deletion hint(s) with a forced reconcile`,
        );
        delivery?.requestReconcile(config.pathPrefix, 'force');
      }
    }
    await delivery?.shutdown();
    await closeHealthServer(healthServer);
    process.exitCode = exitCode;
  };

  const fail = async (error: unknown) => {
    if (shuttingDown) return;
    const message = error instanceof Error ? error.message : String(error);
    const actionable = isInotifyLimitError(error)
      ? `${message}. Increase both fs.inotify.max_user_watches and fs.inotify.max_user_instances on the NAS.`
      : message;
    healthState.fatalError = actionable;
    pingLogger.banner(fatalBanner(config, actionable));
    await shutdown(1);
  };

  try {
    resources.watcher = await startWatcher({
      config,
      onError: (error) => void fail(error),
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
      onPathError: (error) => {
        pingLogger.log(
          'warn',
          `Skipping unsafe watcher path: ${error instanceof Error ? error.message : String(error)}`,
        );
      },
      onReady: (counts) => {
        protocol.markWatcherReady();
        healthState.watcherReady = true;
        pingLogger.log(
          'info',
          `✔ Watching ${counts.directories.toLocaleString('en')} directories · ${counts.entries.toLocaleString('en')} entries`,
        );
        if (!delivery) return;
        void verifyPathMapping(delivery.probe, counts.sampleFile, pingLogger);
        if (config.reconcileOnStart !== 'false') {
          delivery.requestReconcile(
            config.pathPrefix,
            config.reconcileOnStart === 'auto' ? 'auto' : 'force',
          );
        }
      },
    });
  } catch (error) {
    await fail(error);
    return { batcher, healthServer, shutdown, watcher: undefined };
  }

  if (delivery) {
    resources.heartbeatTimer = setInterval(() => {
      void delivery.heartbeat();
    }, HEARTBEAT_MS);
    resources.heartbeatTimer.unref();
  }

  resources.rollupTimer = setInterval(() => {
    pingLogger.log(
      'info',
      `${config.dryRun ? 'DRY RUN active' : 'PICR delivery active'} · ${detectedEvents} events detected · ${sentDirectories} directory hints ${config.dryRun ? 'logged' : 'queued'} · ${batcher.pendingCount()} pending`,
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

const wait = async (delayMs: number) => {
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
};

const verifyPathMapping = async (
  probe: (
    path: string,
  ) => Promise<'ignored' | 'missing' | 'unavailable' | 'visible'>,
  sampleFile: string | undefined,
  pingLogger: PingLogger,
) => {
  if (!sampleFile) {
    pingLogger.log(
      'info',
      'Path mapping probe skipped: media library is empty',
    );
    return;
  }
  let result: Awaited<ReturnType<typeof probe>> = 'unavailable';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    result = await probe(sampleFile);
    if (result === 'visible' || result === 'ignored') break;
    if (attempt < 3) await wait(2000);
  }
  if (result === 'visible') {
    pingLogger.log('info', `✅ Path mapping verified: ${sampleFile}`);
  } else if (result === 'ignored') {
    pingLogger.log(
      'warn',
      `Path mapping probe is ignored by PICR: ${sampleFile}`,
    );
  } else if (result === 'missing') {
    pingLogger.log(
      'error',
      `PICR cannot see ${sampleFile}; check the media mount and PATH_PREFIX`,
    );
  } else {
    pingLogger.log('warn', `Path mapping probe unavailable for ${sampleFile}`);
  }
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
