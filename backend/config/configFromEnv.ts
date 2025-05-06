import { config } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { addDevLogger, log } from "../logger.js";
import { picrConfig } from "./picrConfig.js";
import { IPicrConfiguration } from "./IPicrConfiguration.js";
import path from 'path';
import { envSchema } from "./envSchema.js";

export const configFromEnv = () => {
  config(); // read .ENV
  const env = envSchema.safeParse(process.env);
  if (!env.success) {
    console.log('\n⚠️ Environment (ENV) Misconfiguration\n');
    env.error.errors.forEach(({ message }) => console.log(`\t${message}\n`));
    console.log('Update your environment configuration and try again 😐\n\n');
    process.exit();
  }

  const d = env.data;
  const c: IPicrConfiguration = {
    updateMetadata: false, //re-read metadata, set by dbMigrate
    version: getVersion(),

    databaseUrl: d.DATABASE_URL,
    port: d.PORT,
    baseUrl: d.BASE_URL,
    usePolling: d.USE_POLLING,
    pollingInterval: d.POLLING_INTERVAL,
    tokenSecret: d.TOKEN_SECRET,

    dev: d.NODE_ENV === 'development',
    debugSql: d.DEBUG_SQL,
    consoleLogging: d.CONSOLE_LOGGING,

    mediaPath: path.join(process.cwd(), 'media'),
    cachePath: path.join(process.cwd(), 'cache'),
  };

  log('info', '#️⃣  Version: ' + (c.dev ? '[DEV] ' : '') + c.version, true);
  // if (c.dev) {
  //   console.log('SERVER CONFIGURATION ONLY DISPLAYED IN DEV MODE');
  //   console.log(c);
  // }

  if (c.consoleLogging) {
    addDevLogger();
  }
  for (const [key, value] of Object.entries(c)) {
    picrConfig[key] = value;
  }
};

export const getVersion = () => {
  const p = './version.txt';
  if (existsSync(p)) {
    return readFileSync(p, 'utf8').trim();
  } else {
    return 'DEV';
  }
};
