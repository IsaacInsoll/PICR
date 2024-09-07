import { prettyDateNoTZ } from '../components/FileListView/Filtering/PrettyDate';
import prettyBytes from 'pretty-bytes';
import {
  AnyMetadataKey,
  formattedValue,
} from '../components/FileListView/Filtering/MetadataBox';
import humanizeDuration from 'humanize-duration';

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
    data.label = humanizeDuration(value * 1000, { round: true });
  }

  return data;
};
