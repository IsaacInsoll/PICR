import { z } from 'zod';
import { randomBytes } from 'node:crypto';

//from https://github.com/colinhacks/zod/issues/2985
const castStringToBool = z
  .preprocess((val) => {
    if (typeof val === 'string') {
      if (['1', 'true'].includes(val.toLowerCase())) return true;
      if (['0', 'false'].includes(val.toLowerCase())) return false;
    }
    return val;
  }, z.coerce.boolean())
  .default(false);

export const envSchema = z.object({
  DATABASE_URL: z
    .string({
      description: 'Postgres Database URL',
      required_error: 'DATABASE_URL is required',
    })
    .url({ message: 'DATABASE_URL is not a URL' })
    .min(3),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),

  PORT: z.coerce
    .number({
      description:
        '.env files convert numbers to strings, therefoore we have to enforce them to be numbers',
    })
    .positive()
    .max(65536, `options.port should be >= 0 and < 65536`)
    .default(6900),

  BASE_URL: z
    .string({
      description: 'Base URL',
      required_error: 'BASE_URL is required (EG: https://picr.mysite.com)',
    })
    .url()
    .endsWith('/', { message: 'BASE_URL must end with trailing /' })
    .min(10),

  POLLING_INTERVAL: z.coerce
    .number({ description: 'Polling Interval' })
    .positive()
    .default(20),

  TOKEN_SECRET: z
    .string({
      description: 'TOKEN_SECRET',
    })
    .min(64)
    .optional(),

  DEBUG_SQL: castStringToBool,
  CONSOLE_LOGGING: castStringToBool,
  USE_POLLING: castStringToBool,
});
