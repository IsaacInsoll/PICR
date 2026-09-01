import { describe, expect, test } from 'vitest';
import {
  dateTimePickerFormatFor,
  datesProviderSettingsFor,
  mantineDayOfWeek,
  regionalWeekSettingsForLocale,
} from './mantineDates';

describe('Mantine date localization', () => {
  test('maps Intl weekday numbers to Mantine weekday numbers', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(mantineDayOfWeek)).toEqual([
      1, 2, 3, 4, 5, 6, 0,
    ]);
  });

  test('maps regional week settings when the Intl API is available', () => {
    expect(
      regionalWeekSettingsForLocale({
        getWeekInfo: () => ({ firstDay: 7, weekend: [6, 7] }),
      }),
    ).toEqual({ firstDayOfWeek: 0, weekendDays: [6, 0] });
  });

  test('lets Mantine use its defaults when regional week data is unavailable', () => {
    expect(regionalWeekSettingsForLocale({})).toEqual({});
    expect(
      regionalWeekSettingsForLocale({
        getWeekInfo: () => {
          throw new Error('unsupported');
        },
      }),
    ).toEqual({});
  });

  test('keeps prose language separate from regional week formatting', () => {
    expect(datesProviderSettingsFor('en', 'en-US')).toEqual({
      locale: 'en-au',
      firstDayOfWeek: 0,
      weekendDays: [6, 0],
    });
    expect(datesProviderSettingsFor('fr', 'fr-FR')).toEqual({
      locale: 'fr',
      firstDayOfWeek: 1,
      weekendDays: [6, 0],
    });
    expect(datesProviderSettingsFor('de', 'de-CH')).toMatchObject({
      locale: 'de',
    });
    expect(datesProviderSettingsFor('es', 'es-MX')).toMatchObject({
      locale: 'es',
    });
    expect(datesProviderSettingsFor('uk', 'uk-UA')).toMatchObject({
      locale: 'uk',
    });
  });

  test('derives date order and 12-hour time from the formatting locale', () => {
    const format = dateTimePickerFormatFor('en-US');
    expect(format).toContain('MM[/]DD[/]YYYY');
    expect(format).toContain('hh[:]mm');
    expect(format).toMatch(/A$/);
  });

  test('derives date order and 24-hour time from the formatting locale', () => {
    const format = dateTimePickerFormatFor('en-GB');
    expect(format).toContain('DD[/]MM[/]YYYY');
    expect(format).toContain('HH[:]mm');
    expect(format).not.toContain('A');
  });

  test('supports year-first formatting locales', () => {
    expect(dateTimePickerFormatFor('ja-JP')).toContain(
      'YYYY[/]MM[/]DD[ ]HH[:]mm',
    );
  });
});
