import {
  AnyMetadataKey,
  formattedValue,
} from '../components/FileListView/Filtering/MetadataBox';
import { formatMetadataValue } from './formatMetadataValue';

export const formatMetadataValues = (
  title: AnyMetadataKey,
  options: (string | number)[],
): formattedValue[] => {
  return options.map((o) => formatMetadataValue(title, o));
};
