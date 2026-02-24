import type { FormattedValue } from '@shared/formatMetadataValue';
import { formatMetadataValue } from '@shared/formatMetadataValue';
import type { AnyMetadataKey } from '@shared/fileMetadata';

export const formatMetadataValues = (
  title: AnyMetadataKey,
  options: (string | number)[],
): FormattedValue[] => {
  return options.map((o) => formatMetadataValue(title, o));
};
