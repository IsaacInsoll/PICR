import { afterEach, describe, expect, it } from 'vitest';
import { prettyDateNoTZ } from '../../shared/formatMetadataValue';

const originalTimezone = process.env.TZ;

afterEach(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

describe('prettyDateNoTZ', () => {
  it.each(['UTC', 'Australia/Brisbane', 'America/New_York'])(
    'keeps EXIF capture time stable when the host timezone is %s',
    (timezone) => {
      process.env.TZ = timezone;

      expect(prettyDateNoTZ('2024-01-15T23:30:00.000Z', 'en')).toBe(
        'January 15, 2024 at 11:30:00 PM',
      );
      expect(prettyDateNoTZ('2024-01-15T23:30:00.000Z', 'fr')).toBe(
        '15 janvier 2024 à 23:30:00',
      );
    },
  );
});
