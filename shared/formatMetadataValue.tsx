import { prettyBytes } from './prettyBytes';
import formatDuration from 'format-duration';
import { AnyMetadataKey } from '@/fileMetadata';
import { tz } from 'moment-timezone';

export interface formattedValue {
  label: string;
  value: string;
  raw: string | number;
}

export const prettyDateNoTZ = (dateString: string): string => {
  // This was tested as matching with Adobe Lightroom perfectly for both `capture time` and `export time`
  const d = new Date(dateString);
  return tz(d, 'YYYY-MM-DDTHH:mm:ss[Z]').format('MMMM Do YYYY, h:mm:ss a');
};
export const formatMetadataValue = (
  title: AnyMetadataKey,
  value: string | number,
): formattedValue => {
  // set default return, which can be overridden below
  const data = {
    value: value ? value.toString() : '',
    label: value ? value.toString() : '',
    raw: value,
  };

  if (title === 'Aperture') data.label = 'ƒ' + value;

  if (title === 'ExposureTime')
    data.label =
      value > 1 ? value.toFixed(1) + ' sec' : '¹/' + (1 / value).toString();

  if (title.startsWith('DateTime')) {
    data.value = value;
    data.label = prettyDateNoTZ(value);
  }

  if (title === 'Bitrate')
    data.label = value ? prettyBytes(value, { bits: true }) : '';

  if (title === 'Duration' && value) {
    data.label = formatDuration(value * 1000);
  }

  if (title === 'Framerate') data.label = value ? value + '/s' : null;

  return data;
};
