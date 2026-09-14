import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import { type GalleryFilterCriteria } from '@shared/files/mediaCriteria';
import type { MediaResultsInput, MediaResultsQuery } from '@shared/gql/graphql';
import { useTranslation } from 'react-i18next';
import { countRecursiveGalleryFilters } from '../../helpers/mediaResultsInput';
import { CloseIcon, PreviousIcon, SearchIcon } from '../../PicrIcons';
import { GalleryFilterChips } from './Filtering/GalleryFilterChips';
import { ResultsFolderFilter } from './ResultsFolderFilter';

type ResultsSummary = Pick<
  MediaResultsQuery['mediaResults'],
  | 'totalCount'
  | 'folderCount'
  | 'selectionFingerprint'
  | 'selectedFolders'
  | 'folderFacets'
>;

export const GalleryResultsBar = ({
  folderName,
  query,
  filters,
  folderIds,
  input,
  results,
  localFiltersPaused,
  onQueryChange,
  onFiltersChange,
  onFolderIdsChange,
  onClear,
  onBack,
}: {
  folderName: string;
  query: string;
  filters: GalleryFilterCriteria;
  folderIds: string[];
  input: MediaResultsInput;
  results?: ResultsSummary;
  localFiltersPaused: boolean;
  onQueryChange: (query: string) => void;
  onFiltersChange: (filters: GalleryFilterCriteria) => void;
  onFolderIdsChange: (folderIds: string[]) => void;
  onClear: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation('gallery');
  const hasCriteria =
    !!query ||
    countRecursiveGalleryFilters(filters) > 0 ||
    folderIds.length > 0;

  return (
    <Container size="xl" w="100%">
      <Paper
        withBorder
        radius="md"
        px="sm"
        py="xs"
        data-testid="gallery-results-bar"
      >
        <Stack gap="xs">
          <Group justify="space-between" gap="xs" wrap="wrap">
            <Group gap="xs" wrap="nowrap">
              <Button
                variant="subtle"
                size="compact-sm"
                leftSection={<PreviousIcon size={16} />}
                onClick={onBack}
              >
                {t('results.backTo', { folder: folderName })}
              </Button>
              <Text size="sm" fw={600} visibleFrom="xs">
                {t('results.heading')}
              </Text>
            </Group>
            {results ? (
              <Text size="sm" c="dimmed" aria-live="polite">
                {t('count.file', { count: results.totalCount })}
                {' · '}
                {t('count.folder', { count: results.folderCount })}
              </Text>
            ) : null}
          </Group>

          <Group justify="space-between" gap="xs" align="flex-start">
            <Group gap={6} wrap="wrap" flex={1}>
              {query ? (
                <Button
                  variant="light"
                  size="compact-sm"
                  leftSection={<SearchIcon size={14} />}
                  rightSection={<CloseIcon size={14} />}
                  onClick={() => onQueryChange('')}
                  aria-label={t('results.clearQuery', { query })}
                >
                  {t('results.queryChip', { query })}
                </Button>
              ) : null}
              <GalleryFilterChips
                filters={filters}
                onChange={onFiltersChange}
                includeMetadata={false}
              />
              {results ? (
                <ResultsFolderFilter
                  input={input}
                  selectionFingerprint={results.selectionFingerprint}
                  rootFolderName={folderName}
                  rootPage={results.folderFacets}
                  selectedFolders={results.selectedFolders}
                  folderIds={folderIds}
                  onChange={onFolderIdsChange}
                />
              ) : null}
            </Group>
            {hasCriteria ? (
              <Button variant="subtle" size="compact-sm" onClick={onClear}>
                {t('filter.clearNone')}
              </Button>
            ) : null}
          </Group>

          {localFiltersPaused ? (
            <Alert variant="light" py="xs">
              {t('results.localFiltersPaused', { folder: folderName })}
            </Alert>
          ) : null}
        </Stack>
      </Paper>
    </Container>
  );
};
