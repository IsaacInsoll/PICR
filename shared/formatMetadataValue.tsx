import { prettyBytes } from './prettyBytes';
import formatDuration from 'format-duration';
import type { AnyMetadataKey } from '@shared/fileMetadata';
import { formatDate, formatNumber } from './i18n/formatting';

export interface FormattedValue {
  label: string;
  value: string;
  raw: string | number;
}

export const prettyDateNoTZ = (dateString: string, locale = 'en'): string => {
  // This was tested as matching with Adobe Lightroom perfectly for both `capture time` and `export time`
  return formatDate(dateString, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  });
};
export const formatMetadataValue = (
  title: AnyMetadataKey,
  value: string | number,
  locale = 'en',
): FormattedValue => {
  // set default return, which can be overridden below
  const data = {
    value: value ? value.toString() : '',
    label: value ? value.toString() : '',
    raw: value,
  };
  const numericValue = Number(value);
  const hasNumericValue = Number.isFinite(numericValue);

  if (title === 'Aperture' && hasNumericValue) {
    data.label = `ƒ${formatNumber(numericValue, locale)}`;
  }

  if (title === 'ExposureTime' && hasNumericValue && numericValue > 0) {
    data.label =
      numericValue > 1
        ? formatNumber(numericValue, locale, {
            style: 'unit',
            unit: 'second',
            unitDisplay: 'short',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        : // Shutter denominators are technical notation (1/8000), not a
          // quantity being scanned for magnitude, so they are never grouped.
          `¹/${formatNumber(1 / numericValue, locale, {
            maximumFractionDigits: 2,
            useGrouping: false,
          })}`;
  }

  if (title.startsWith('DateTime') && typeof value === 'string') {
    data.value = value;
    data.label = prettyDateNoTZ(value, locale);
  }

  if (title === 'Bitrate' && hasNumericValue) {
    data.label = numericValue
      ? prettyBytes(numericValue, { bits: true, locale })
      : '';
  }

  if (title === 'Duration' && typeof value === 'number' && value) {
    data.label = formatDuration(value * 1000);
  }

  if (title === 'Framerate' && hasNumericValue) {
    data.label = numericValue
      ? `${formatNumber(numericValue, locale)} fps`
      : '';
  }

  return data;
};
