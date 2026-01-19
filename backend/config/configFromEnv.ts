import { config } from 'dotenv';
import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { addDevLogger, log } from '../logger.js';
import { picrConfig } from './picrConfig.js';
import { IPicrConfiguration } from './IPicrConfiguration.js';
import path from 'path';
import { envSchema } from './envSchema.js';

export const configFromEnv = () => {
  config(); // read .ENV
  const env = envSchema.safeParse(process.env);
  if (!env.success) {
    console.log('\n⚠️ Environment (ENV) Misconfiguration\n');
    env.error.errors.forEach(({ message }) => console.log(`\t${message}\n`));
    console.log('Update your environment configuration and try again 😐\n\n');
    process.exit();
  }

  const mediaPath = path.join(process.cwd(), 'media');
  const cachePath = path.join(process.cwd(), 'cache');

  const d = env.data;
  const baseUrl = new URL(d.BASE_URL);
  const baseUrlPathname =
    baseUrl.pathname === '/'
      ? '/'
      : baseUrl.pathname.endsWith('/')
        ? baseUrl.pathname
        : `${baseUrl.pathname}/`;
  const c: IPicrConfiguration = {
    updateMetadata: false, //re-read metadata, set by dbMigrate
    version: getVersion(),

    databaseUrl: d.DATABASE_URL,
    port: d.PORT,
    baseUrl: d.BASE_URL,
    baseUrlOrigin: baseUrl.origin,
    baseUrlPathname,
    usePolling: d.USE_POLLING,
    pollingInterval: d.POLLING_INTERVAL,
    tokenSecret: d.TOKEN_SECRET,

    dev: d.NODE_ENV === 'development',
    debugSql: d.DEBUG_SQL,
    consoleLogging: d.CONSOLE_LOGGING,

    mediaPath,
    cachePath,
    canWrite: d.CAN_WRITE && testWriteAccess(mediaPath),
  };

  log('info', '#️⃣  Version: ' + (c.dev ? '[DEV] ' : '') + c.version, true);
  // if (c.dev) {
  //   console.log('SERVER CONFIGURATION ONLY DISPLAYED IN DEV MODE');
  //   console.log(c);
  // }

  if (c.consoleLogging) {
    addDevLogger();
  }
  Object.assign(picrConfig, c);
};

const getVersion = () => {
  const p = './version.txt';
  if (existsSync(p)) {
    return readFileSync(p, 'utf8').trim();
  } else {
    return 'DEV';
  }
};

const testWriteAccess = (path: string): boolean => {
  try {
    accessSync(path, constants.R_OK | constants.W_OK);
    return true;
  } catch (err) {
    return false;
  }
};
