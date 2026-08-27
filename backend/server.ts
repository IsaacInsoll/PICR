import pkg from './package.json' with { type: 'json' };
import { fileWatcher } from './filesystem/fileWatcher.js';
import { setupRootFolder } from './filesystem/events/addFolder.js';
import { envPassword } from './boot/envPassword.js';
import { expressServer } from './express/express.js';
import { dbMigrate } from './boot/dbMigrate.js';
import { log } from './logger.js';
import { picrConfig } from './config/picrConfig.js';
import { initDb } from './db/picrDb.js';
import { schemaMigration } from './db/schemaMigration.js';
import { logStartupBanner, logFatalBanner } from './boot/startupBanner.js';
import { detectInodeSupport } from './boot/detectInodeSupport.js';
import { startScheduledScan } from './filesystem/scheduledScan.js';
import { pingScanCoordinator } from './filesystem/pingScanCoordinator.js';

export const server = async () => {
  try {
    await schemaMigration();
    initDb();
    await dbMigrate(picrConfig);
  } catch (e) {
    logFatalBanner(picrConfig, String(e));
    process.exit(1);
  }

  const rootFolder = await setupRootFolder();
  if (!rootFolder) throw new Error('Root folder failed to initialize');
  detectInodeSupport();
  await envPassword();
  const appName = pkg.name;
  const express = expressServer();
  const httpServer = express.listen(picrConfig.port, () => {
    logStartupBanner(picrConfig);
  });
  const scheduledScan = { stop: undefined as (() => void) | undefined };

  const gracefulShutdown = (signal: string) => {
    log('info', `${signal} received, shutting down ${appName}...`, true);
    scheduledScan.stop?.();
    pingScanCoordinator.stop();
    httpServer.close(() => {
      log('info', `💀 ${appName} closed`, true);
      process.exit(0);
    });
    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      log('error', 'Shutdown timed out, forcing exit');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  await fileWatcher(picrConfig, rootFolder.id);
  scheduledScan.stop = startScheduledScan(picrConfig, rootFolder.id);
};
