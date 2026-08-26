import { hostname } from 'node:os';
import { resolve } from 'node:path';
import { z } from 'zod';
import { normaliseWirePath } from './pathMapping.js';

const optionalNonEmptyString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
);

const booleanFromEnv = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === '') return defaultValue;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, z.boolean());

const positiveNumberFromEnv = (defaultValue: number) =>
  z.preprocess(
    (value) =>
      value === undefined || value === '' ? defaultValue : Number(value),
    z.number().finite().positive(),
  );

const positiveIntegerFromEnv = (defaultValue: number) =>
  z.preprocess(
    (value) =>
      value === undefined || value === '' ? defaultValue : Number(value),
    z.number().int().positive(),
  );

const envSchema = z
  .object({
    BATCH_SECONDS: positiveNumberFromEnv(1),
    DRY_RUN: booleanFromEnv(false),
    PATH_PREFIX: z.string().default(''),
    PICR_PING_NAME: optionalNonEmptyString,
    PICR_PING_TOKEN: optionalNonEmptyString,
    PICR_URL: optionalNonEmptyString,
    POLL_INTERVAL_SECONDS: positiveNumberFromEnv(20),
    STABILITY_SECONDS: positiveNumberFromEnv(2),
    VERBOSE: booleanFromEnv(false),
    WATCH_MODE: z.enum(['native', 'polling']).default('native'),
    WATCH_ROOT: z.string().min(1).default('/media'),
    PING_HEALTH_PORT: positiveIntegerFromEnv(6901),
  })
  .superRefine((env, context) => {
    if (env.DRY_RUN) return;
    if (!env.PICR_URL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'PICR_URL is required unless DRY_RUN=true',
        path: ['PICR_URL'],
      });
    }
    if (!env.PICR_PING_TOKEN || env.PICR_PING_TOKEN.length < 64) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'PICR_PING_TOKEN must contain at least 64 characters unless DRY_RUN=true',
        path: ['PICR_PING_TOKEN'],
      });
    }
  });

export type PingConfig = {
  batchMs: number;
  dryRun: boolean;
  healthPort: number;
  pathPrefix: string;
  pingName: string;
  pingToken?: string;
  picrUrl?: URL;
  pollIntervalMs: number;
  stabilityMs: number;
  verbose: boolean;
  version: string;
  watchMode: 'native' | 'polling';
  watchRoot: string;
};

export const configFromEnv = (env: NodeJS.ProcessEnv): PingConfig => {
  const parsed = envSchema.parse(env);
  const pathPrefix = normaliseWirePath(parsed.PATH_PREFIX, 'PATH_PREFIX');
  const pingName = parsed.PICR_PING_NAME ?? hostname();
  if (/\p{Cc}/u.test(pingName) || pingName.length > 64) {
    throw new Error(
      'PICR_PING_NAME must be at most 64 characters and contain no control characters',
    );
  }

  let picrUrl: URL | undefined;
  if (parsed.PICR_URL) {
    picrUrl = new URL(parsed.PICR_URL);
    if (picrUrl.protocol !== 'http:' && picrUrl.protocol !== 'https:') {
      throw new Error('PICR_URL must use http:// or https://');
    }
    if (!picrUrl.pathname.endsWith('/')) picrUrl.pathname += '/';
  }

  return {
    batchMs: parsed.BATCH_SECONDS * 1000,
    dryRun: parsed.DRY_RUN,
    healthPort: parsed.PING_HEALTH_PORT,
    pathPrefix,
    pingName,
    pingToken: parsed.PICR_PING_TOKEN,
    picrUrl,
    pollIntervalMs: parsed.POLL_INTERVAL_SECONDS * 1000,
    stabilityMs: parsed.STABILITY_SECONDS * 1000,
    verbose: parsed.VERBOSE,
    version:
      env['PICR_PING_VERSION'] ?? env['npm_package_version'] ?? 'development',
    watchMode: parsed.WATCH_MODE,
    watchRoot: resolve(parsed.WATCH_ROOT),
  };
};
