import { prettyBytes } from './prettyBytes';
import formatDuration from 'format-duration';
import type { AnyMetadataKey } from '@shared/fileMetadata';

export interface FormattedValue {
  label: string;
  value: string;
  raw: string | number;
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const ordinal = (day: number) => {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

export const prettyDateNoTZ = (dateString: string): string => {
  // This was tested as matching with Adobe Lightroom perfectly for both `capture time` and `export time`
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'Invalid date';

  const hours = d.getUTCHours();
  const displayHours = hours % 12 || 12;
  const minutes = d.getUTCMinutes().toString().padStart(2, '0');
  const seconds = d.getUTCSeconds().toString().padStart(2, '0');
  const meridiem = hours < 12 ? 'am' : 'pm';

  return `${months[d.getUTCMonth()]} ${ordinal(
    d.getUTCDate(),
  )} ${d.getUTCFullYear()}, ${displayHours}:${minutes}:${seconds} ${meridiem}`;
};
export const formatMetadataValue = (
  title: AnyMetadataKey,
  value: string | number,
): FormattedValue => {
  // set default return, which can be overridden below
  const data = {
    value: value ? value.toString() : '',
    label: value ? value.toString() : '',
    raw: value,
  };

  if (title === 'Aperture') data.label = 'ƒ' + value;

  if (title === 'ExposureTime' && typeof value === 'number') {
    data.label =
      value > 1 ? value.toFixed(1) + ' sec' : '¹/' + (1 / value).toString();
  }

  if (title.startsWith('DateTime') && typeof value === 'string') {
    data.value = value;
    data.label = prettyDateNoTZ(value);
  }

  if (title === 'Bitrate' && typeof value === 'number') {
    data.label = value ? prettyBytes(value, { bits: true }) : '';
  }

  if (title === 'Duration' && typeof value === 'number' && value) {
    data.label = formatDuration(value * 1000);
  }

  if (title === 'Framerate') data.label = value ? value + '/s' : '';

  return data;
};
