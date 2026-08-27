import { expect, test } from 'vitest';
import { configFromEnv } from '../src/config.js';
import { startupBanner } from '../src/pingBanner.js';

test('the Ping startup banner stays compact beside its stacked logo', () => {
  const rendered = startupBanner(
    configFromEnv({
      PICR_PING_NAME: 'studio-nas',
      PICR_PING_TOKEN: 'a'.repeat(64),
      PICR_PING_VERSION: '0.1.0',
      PICR_URL: 'http://picr:6900/',
    }),
  );

  const lines = rendered.split('\n');
  const topBorder = lines.find((line) => line.includes('┌'));
  if (!topBorder) throw new Error('Banner did not contain a top border');
  expect(topBorder.length - topBorder.indexOf('┌')).toBeLessThanOrEqual(54);
  expect(Math.max(...lines.map((line) => line.length))).toBeLessThanOrEqual(90);
});
