import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { addDevLogger, log } from '../logger';
import { picrConfig } from './picrConfig';
import { IPicrConfiguration } from './IPicrConfiguration';
import path from 'path';

export const configFromEnv = () => {
  config(); // read .ENV
  const port = Number(process.env.PORT);

  const c: IPicrConfiguration = {
    tokenSecret: process.env.TOKEN_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    debugSql: process.env.DEBUG_SQL == 'true',
    consoleLogging: process.env.CONSOLE_LOGGING == 'true',
    usePolling: process.env.USE_POLLING == 'true',
    port: !isNaN(port) ? port : 6900,
    pollingInterval: parseInt(process.env.POLLING_INTERVAL) ?? 20,
    dev: process.env.NODE_ENV === 'development',
    version: getVersion(),
    updateMetadata: false, //re-read metadata, set by dbMigrate
    mediaPath: path.join(process.cwd(), 'media'),
    cachePath: path.join(process.cwd(), 'cache'),
  };

  if (!c.tokenSecret) {
    const secret = randomBytes(64).toString('hex');
    console.log(`ERROR: You haven't specified a TOKEN_SECRET in .ENV
Heres one we just created for you:
TOKEN_SECRET=${secret}`);
    process.exit();
  }

  if (c.dev) {
    log('info', '#️⃣ Version: ' + (c.dev ? '[DEV] ' : '') + c.version, true);
    console.log('SERVER CONFIGURATION ONLY DISPLAYED IN DEV MODE');
    console.log(c);
  }

  if (c.consoleLogging) {
    addDevLogger();
  }
  for (const [key, value] of Object.entries(c)) {
    picrConfig[key] = value;
  }
};

export const getVersion = () => {
  return readFileSync('dist/version.txt', 'utf8');
};