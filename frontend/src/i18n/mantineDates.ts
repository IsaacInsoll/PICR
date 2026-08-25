import type { SupportedLanguage } from '@shared/i18n/languages';
import type { DatesProviderSettings, DayOfWeek } from '@mantine/dates';

import 'dayjs/locale/el';
import 'dayjs/locale/en-au';
import 'dayjs/locale/fr';

const dayjsLocales: Record<SupportedLanguage, string> = {
  el: 'el',
  en: 'en-au',
  fr: 'fr',
};

const dayjsLocaleFor = (language: SupportedLanguage): string =>
  dayjsLocales[language];

export const mantineDayOfWeek = (intlDayOfWeek: number): DayOfWeek => {
  switch (intlDayOfWeek % 7) {
    case 0:
      return 0;
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
      return 4;
    case 5:
      return 5;
    case 6:
      return 6;
    default:
      return 1;
  }
};

// `Intl.Locale.prototype.getWeekInfo` is optional and comparatively recent: engines
// shipped an earlier `weekInfo` getter before this method form, so supporting one
// does not imply supporting the other. This runs inside App's render, above every
// error boundary, so an unguarded call would blank the whole UI on older browsers
// rather than degrade a cosmetic calendar detail. Omitting the keys lets Mantine
// fall back to its own defaults.
type WeekInfoLocale = {
  getWeekInfo?: () => Pick<Intl.WeekInfo, 'firstDay' | 'weekend'>;
};

export const regionalWeekSettingsForLocale = (
  locale: WeekInfoLocale,
): DatesProviderSettings => {
  if (typeof locale.getWeekInfo !== 'function') return {};

  try {
    const weekInfo = locale.getWeekInfo();
    return {
      firstDayOfWeek: mantineDayOfWeek(weekInfo.firstDay),
      weekendDays: weekInfo.weekend.map(mantineDayOfWeek),
    };
  } catch {
    return {};
  }
};

const regionalWeekSettings = (
  formattingLocale: string,
): DatesProviderSettings => {
  try {
    return regionalWeekSettingsForLocale(new Intl.Locale(formattingLocale));
  } catch {
    return {};
  }
};

export const datesProviderSettingsFor = (
  language: SupportedLanguage,
  formattingLocale: string,
): DatesProviderSettings => ({
  locale: dayjsLocaleFor(language),
  ...regionalWeekSettings(formattingLocale),
});

export const dateTimePickerFormatFor = (locale: string): string => {
  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const hourToken = formatter.resolvedOptions().hour12 ? 'hh' : 'HH';
  const tokenForPart: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {
    year: 'YYYY',
    month: 'MM',
    day: 'DD',
    minute: 'mm',
    dayPeriod: 'A',
  };

  return formatter
    .formatToParts(new Date(2001, 10, 22, 13, 45))
    .map(({ type, value }) =>
      type === 'hour' ? hourToken : (tokenForPart[type] ?? `[${value}]`),
    )
    .join('');
};
