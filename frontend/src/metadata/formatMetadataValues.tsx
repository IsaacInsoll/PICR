import {
  formatMetadataValue,
  formattedValue,
} from '@shared/formatMetadataValue';
import { AnyMetadataKey } from '@shared/fileMetadata';

export const formatMetadataValues = (
  title: AnyMetadataKey,
  options: (string | number)[],
): formattedValue[] => {
  return options.map((o) => formatMetadataValue(title, o));
};
