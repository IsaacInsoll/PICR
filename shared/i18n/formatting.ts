import { defaultLanguage } from './languages';
import { resolveLanguage } from './resolveLanguage';

// These helpers stay pure and must not reach the catalogs or the i18next
// runtime: the app imports them directly while its own UI is untranslated, and
// coupling them to the catalog registry would pull every catalog into any
// consumer that formats a number. Callers that have a translator pass the
// localized label (the web UI uses `t('date.invalid')`); everyone else gets
// English, matching the locale default on these functions.
export const defaultInvalidDateLabel = 'Invalid date';

export type DateInput = Date | number | string;

export const defaultDateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
} satisfies Intl.DateTimeFormatOptions;

export const tooltipDateTimeFormatOptions = {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
} satisfies Intl.DateTimeFormatOptions;

const dateFrom = (value: DateInput): Date =>
  value instanceof Date ? value : new Date(value);

export const formatDate = (
  value: DateInput,
  locale: string = defaultLanguage,
  options: Intl.DateTimeFormatOptions = defaultDateTimeFormatOptions,
  invalidLabel: string = defaultInvalidDateLabel,
): string => {
  const date = dateFrom(value);
  if (Number.isNaN(date.getTime())) return invalidLabel;

  return new Intl.DateTimeFormat(
    resolveLanguage(locale).formattingLocale,
    options,
  ).format(date);
};

export const formatNumber = (
  value: number,
  locale: string = defaultLanguage,
  options?: Intl.NumberFormatOptions,
): string =>
  new Intl.NumberFormat(
    resolveLanguage(locale).formattingLocale,
    options,
  ).format(value);

export interface FormatBytesOptions {
  bits?: boolean;
  maximumSignificantDigits?: number;
}

export interface FormattedBytes {
  value: number;
  unit: string;
  formattedValue: string;
  formatted: string;
  fractionDigits: number;
}

const byteUnits = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
const bitUnits = [
  'b',
  'kbit',
  'Mbit',
  'Gbit',
  'Tbit',
  'Pbit',
  'Ebit',
  'Zbit',
  'Ybit',
];

const numericBytes = (bytes: number | bigint | string): number => {
  const parsed = Number(bytes);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatBytes = (
  bytes: number | bigint | string,
  locale: string = defaultLanguage,
  options: FormatBytesOptions = {},
): FormattedBytes => {
  const units = options.bits ? bitUnits : byteUnits;
  const numericValue = numericBytes(bytes);
  const absoluteValue = Math.abs(numericValue);
  let unitIndex =
    absoluteValue < 1
      ? 0
      : Math.min(Math.floor(Math.log10(absoluteValue) / 3), units.length - 1);
  const maximumSignificantDigits = options.maximumSignificantDigits ?? 3;
  let value =
    numericValue === 0
      ? 0
      : Number(
          (numericValue / 1000 ** unitIndex).toPrecision(
            maximumSignificantDigits,
          ),
        );

  if (Math.abs(value) >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }

  const formatter = new Intl.NumberFormat(
    resolveLanguage(locale).formattingLocale,
    { maximumSignificantDigits },
  );
  const parts = formatter.formatToParts(value);
  const formattedValue = parts.map(({ value: part }) => part).join('');
  const fractionDigits =
    parts.find(({ type }) => type === 'fraction')?.value.length ?? 0;
  const unit = units[unitIndex] ?? (options.bits ? 'b' : 'B');

  return {
    value,
    unit,
    formattedValue,
    formatted: `${formattedValue} ${unit}`,
    fractionDigits,
  };
};

type RelativeTimeUnit = Intl.RelativeTimeFormatUnit;

const relativeTimeThresholds: readonly {
  limitSeconds: number;
  unitSeconds: number;
  unit: RelativeTimeUnit;
}[] = [
  { limitSeconds: 60, unitSeconds: 1, unit: 'second' },
  { limitSeconds: 60 * 60, unitSeconds: 60, unit: 'minute' },
  { limitSeconds: 24 * 60 * 60, unitSeconds: 60 * 60, unit: 'hour' },
  { limitSeconds: 7 * 24 * 60 * 60, unitSeconds: 24 * 60 * 60, unit: 'day' },
  {
    limitSeconds: 30.4375 * 24 * 60 * 60,
    unitSeconds: 7 * 24 * 60 * 60,
    unit: 'week',
  },
  {
    limitSeconds: 365.25 * 24 * 60 * 60,
    unitSeconds: 30.4375 * 24 * 60 * 60,
    unit: 'month',
  },
  {
    limitSeconds: Number.POSITIVE_INFINITY,
    unitSeconds: 365.25 * 24 * 60 * 60,
    unit: 'year',
  },
];

export const formatRelativeTime = (
  value: DateInput,
  locale: string = defaultLanguage,
  now: DateInput = Date.now(),
  invalidLabel: string = defaultInvalidDateLabel,
): string => {
  const date = dateFrom(value);
  const currentDate = dateFrom(now);
  if (Number.isNaN(date.getTime()) || Number.isNaN(currentDate.getTime())) {
    return invalidLabel;
  }

  const deltaSeconds = (date.getTime() - currentDate.getTime()) / 1000;
  // Relative-time output is prose (for example, "2 hours ago"), so it must
  // follow the translated catalog rather than an unsupported regional locale.
  const resolvedLocale = resolveLanguage(locale).catalogLanguage;
  if (Math.abs(deltaSeconds) < 1) {
    return new Intl.RelativeTimeFormat(resolvedLocale, {
      numeric: 'auto',
    }).format(0, 'second');
  }

  const threshold = relativeTimeThresholds.find(
    ({ limitSeconds }) => Math.abs(deltaSeconds) < limitSeconds,
  );
  if (!threshold) return invalidLabel;

  return new Intl.RelativeTimeFormat(resolvedLocale, {
    numeric: 'always',
  }).format(
    Math.sign(deltaSeconds) *
      Math.round(Math.abs(deltaSeconds) / threshold.unitSeconds),
    threshold.unit,
  );
};
