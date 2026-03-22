import { config } from 'dotenv';
import { existsSync, readFileSync } from 'node:fs';
import { addDevLogger, log } from '../logger.js';
import { picrConfig } from './picrConfig.js';
import type { IPicrConfiguration } from './IPicrConfiguration.js';
import path from 'path';
import { envSchema } from './envSchema.js';
import { buildCanWriteWarning, testWriteAccess } from './mediaWriteAccess.js';

export const configFromEnv = () => {
  config(); // read .ENV
  const env = envSchema.safeParse(process.env);
  if (!env.success) {
    process.stderr.write('\n⚠️ Environment (ENV) Misconfiguration\n\n');
    env.error.errors.forEach(({ message }) =>
      process.stderr.write(`\t${message}\n\n`),
    );
    process.stderr.write(
      'Update your environment configuration and try again 😐\n\n',
    );
    process.exit();
  }

  const mediaPath = path.join(process.cwd(), 'media');
  const cachePath = path.join(process.cwd(), 'cache');

  const d = env.data;
  const canWriteToMediaPath = testWriteAccess(mediaPath);
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
    buildChannel: d.PICR_BUILD_CHANNEL,
    developmentBuildSha: d.PICR_DEVELOPMENT_BUILD_SHA,
    gitSha: d.PICR_GIT_SHA,

    databaseUrl: d.DATABASE_URL,
    port: d.PORT,
    baseUrl: d.BASE_URL,
    baseUrlOrigin: baseUrl.origin,
    baseUrlPathname,
    ffmpegPath: d.FFMPEG_PATH,
    ffprobePath: d.FFPROBE_PATH,
    usePolling: d.USE_POLLING,
    pollingInterval: d.POLLING_INTERVAL,
    tokenSecret: d.TOKEN_SECRET,
    loginRateLimitEnabled: d.LOGIN_RATE_LIMIT_ENABLED,
    loginRateLimitWindowMinutes: d.LOGIN_RATE_LIMIT_WINDOW_MINUTES,
    loginRateLimitIpMaxAttempts: d.LOGIN_RATE_LIMIT_IP_MAX_ATTEMPTS,
    loginRateLimitUserIpMaxAttempts: d.LOGIN_RATE_LIMIT_USER_IP_MAX_ATTEMPTS,
    loginRateLimitBlockMinutes: d.LOGIN_RATE_LIMIT_BLOCK_MINUTES,
    loginRateLimitMaxBlockMinutes: d.LOGIN_RATE_LIMIT_MAX_BLOCK_MINUTES,

    dev: d.NODE_ENV === 'development',
    debugSql: d.DEBUG_SQL,
    consoleLogging: d.CONSOLE_LOGGING,

    mediaPath,
    cachePath,
    canWrite: d.CAN_WRITE && canWriteToMediaPath,
  };

  log('info', '#️⃣  Version: ' + (c.dev ? '[DEV] ' : '') + c.version, true);
  if (c.developmentBuildSha) {
    log(
      'warn',
      `👷️ Running development build ${c.developmentBuildSha}. Use this for testing only and move to an official release when available.`,
      true,
    );
  }
  // if (c.dev) {
  //   console.log('SERVER CONFIGURATION ONLY DISPLAYED IN DEV MODE');
  //   console.log(c);
  // }

  if (c.consoleLogging) {
    addDevLogger();
  }
  Object.assign(picrConfig, c);

  if (d.CAN_WRITE && !canWriteToMediaPath) {
    log('warn', buildCanWriteWarning(mediaPath), true);
  }
};

const getVersion = () => {
  const p = './version.txt';
  if (existsSync(p)) {
    return readFileSync(p, 'utf8').trim();
  } else {
    return 'DEV';
  }
};
