import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  formatDate,
  formatRelativeTime,
} from '../../shared/i18n/formatting';
import { prettyDate } from '../../shared/prettyDate';

describe('formatBytes', () => {
  it('returns numeric and display values without requiring string parsing', () => {
    expect(formatBytes(1_400_000_000, 'en-AU')).toEqual({
      value: 1.4,
      unit: 'GB',
      formattedValue: '1.4',
      formatted: '1.4 GB',
      fractionDigits: 1,
    });
  });

  it('localizes the number while preserving the structured numeric value', () => {
    expect(formatBytes(1_400_000_000, 'fr')).toEqual({
      value: 1.4,
      unit: 'GB',
      formattedValue: '1,4',
      formatted: '1,4 GB',
      fractionDigits: 1,
    });
  });

  it('promotes values that round into the next unit', () => {
    expect(formatBytes(999_900, 'en').formatted).toBe('1 MB');
  });

  it('supports bit-rate units', () => {
    expect(formatBytes(12_300_000, 'en', { bits: true }).formatted).toBe(
      '12.3 Mbit',
    );
  });

  it('treats invalid numeric strings as zero bytes', () => {
    expect(formatBytes('not a number', 'en').formatted).toBe('0 B');
  });
});

describe('formatDate', () => {
  it('formats absolute dates in the requested locale', () => {
    const options = {
      dateStyle: 'long',
      timeStyle: 'medium',
      timeZone: 'UTC',
    } satisfies Intl.DateTimeFormatOptions;

    expect(formatDate('2024-01-15T10:30:00Z', 'en', options)).toBe(
      'January 15, 2024 at 10:30:00 AM',
    );
    expect(formatDate('2024-01-15T10:30:00Z', 'fr', options)).toBe(
      '15 janvier 2024 à 10:30:00',
    );
    expect(formatDate('2024-01-15T10:30:00Z', 'el-GR', options)).toBe(
      '15 Ιανουαρίου 2024 στις 10:30:00 π.μ.',
    );
  });

  it('reports invalid dates without throwing', () => {
    expect(formatDate('not a date')).toBe('Invalid date');
  });

  it('lets a caller supply a translated invalid-date label', () => {
    expect(formatDate('not a date', 'fr', undefined, 'Date invalide')).toBe(
      'Date invalide',
    );
    expect(prettyDate('not a date', 'fr', 'Date invalide')).toBe(
      'Date invalide',
    );
  });
});

describe('formatRelativeTime', () => {
  const now = '2024-01-15T12:00:00Z';

  it.each([
    ['2024-01-15T11:59:30Z', '30 seconds ago'],
    ['2024-01-15T11:58:30Z', '2 minutes ago'],
    ['2024-01-15T10:30:00Z', '2 hours ago'],
    ['2024-01-07T12:00:00Z', '1 week ago'],
    ['2023-12-01T12:00:00Z', '1 month ago'],
    ['2022-07-15T12:00:00Z', '2 years ago'],
  ])('selects an explicit unit for %s', (value, expected) => {
    expect(formatRelativeTime(value, 'en', now)).toBe(expected);
  });

  it('uses the catalog language for relative-time prose', () => {
    expect(formatRelativeTime('2024-01-15T10:30:00Z', 'fr', now)).toBe(
      'il y a 2 heures',
    );
    expect(formatRelativeTime('2024-01-15T10:30:00Z', 'el-GR', now)).toBe(
      'πριν από 2 ώρες',
    );
  });

  it('falls back to English prose for unsupported regional locales', () => {
    expect(formatRelativeTime('2024-01-15T10:30:00Z', 'de-DE', now)).toBe(
      '2 hours ago',
    );
  });

  it('uses a natural label for the current instant', () => {
    expect(formatRelativeTime(now, 'en', now)).toBe('now');
  });

  it('reports invalid dates without throwing', () => {
    expect(formatRelativeTime('not a date', 'en', now)).toBe('Invalid date');
  });

  it('lets a caller supply a translated invalid-date label', () => {
    expect(formatRelativeTime('not a date', 'fr', now, 'Date invalide')).toBe(
      'Date invalide',
    );
  });
});
