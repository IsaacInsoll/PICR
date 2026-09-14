import type { GalleryFilterCriteria } from '@shared/files/mediaCriteria';
import { mediaMatchSummaryQuery } from '@shared/urql/queries/mediaResultsQuery';
import { useDebouncedValue } from '@mantine/hooks';
import { useMemo } from 'react';
import { useQuery } from 'urql';
import {
  countRecursiveGalleryFilters,
  hasLocalOnlyGalleryFilters,
  mediaResultsFilterInput,
} from '../helpers/mediaResultsInput';

export const useGalleryMatchSummary = ({
  folderId,
  hasSubfolders,
  filters,
}: {
  folderId: string;
  hasSubfolders: boolean;
  filters: GalleryFilterCriteria;
}) => {
  const hasLocalOnlyFilters = hasLocalOnlyGalleryFilters(filters);
  const recursiveFilterCount = countRecursiveGalleryFilters(filters);
  const enabled =
    hasSubfolders && recursiveFilterCount > 0 && !hasLocalOnlyFilters;
  const input = useMemo(
    () => ({ folderId, filters: mediaResultsFilterInput(filters) }),
    [filters, folderId],
  );
  const [debouncedInput] = useDebouncedValue(input, 250);
  const [result] = useQuery({
    query: mediaMatchSummaryQuery,
    variables: { input: debouncedInput },
    pause: !enabled,
  });

  return {
    ...result,
    enabled,
    hasLocalOnlyFilters,
    summary: enabled ? result.data?.mediaMatchSummary : undefined,
  };
};
