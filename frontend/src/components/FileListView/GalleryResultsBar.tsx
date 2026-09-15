import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { type GalleryFilterCriteria } from '@shared/files/mediaCriteria';
import type { MediaResultsInput, MediaResultsQuery } from '@shared/gql/graphql';
import type { ViewFolder } from '@shared/files/sortFiles';
import { useTranslation } from 'react-i18next';
import {
  countRecursiveGalleryFilters,
  mediaResultsSelectionInput,
} from '../../helpers/mediaResultsInput';
import {
  CloseIcon,
  CsvExportIcon,
  PreviousIcon,
  SearchIcon,
} from '../../PicrIcons';
import { GalleryFilterChips } from './Filtering/GalleryFilterChips';
import { ResultsFolderFilter } from './ResultsFolderFilter';
import type { ResultsReviewStatus } from '../../helpers/resultsReviewStatus';
import { DownloadZipButton } from '../DownloadZipButton';
import { useMe } from '../../hooks/useMe';

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
  folder,
  query,
  filters,
  folderIds,
  input,
  results,
  localFiltersPaused,
  reviewStatus,
  refreshingSession,
  onQueryChange,
  onFiltersChange,
  onFolderIdsChange,
  onClear,
  onBack,
  onRefresh,
  onCsvExport,
}: {
  folderName: string;
  folder: ViewFolder;
  query: string;
  filters: GalleryFilterCriteria;
  folderIds: string[];
  input: MediaResultsInput;
  results?: ResultsSummary;
  localFiltersPaused: boolean;
  reviewStatus: ResultsReviewStatus;
  refreshingSession: boolean;
  onQueryChange: (query: string) => void;
  onFiltersChange: (filters: GalleryFilterCriteria) => void;
  onFolderIdsChange: (folderIds: string[]) => void;
  onClear: () => void;
  onBack: () => void;
  onRefresh: () => void;
  onCsvExport: () => void;
}) => {
  const { t } = useTranslation('gallery');
  const me = useMe();
  const hasCriteria =
    !!query ||
    countRecursiveGalleryFilters(filters) > 0 ||
    folderIds.length > 0;
  const downloadSelection = mediaResultsSelectionInput({
    folderId: folder.id,
    query,
    filters,
    folderIds,
  });
  const reviewChanged =
    reviewStatus.noLongerMatch > 0 || reviewStatus.sortChanged > 0;

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
            <Group gap="xs">
              {results ? (
                <Text size="sm" c="dimmed" aria-live="polite">
                  {t('count.file', { count: results.totalCount })}
                  {' · '}
                  {t('count.folder', { count: results.folderCount })}
                </Text>
              ) : null}
              {results ? (
                <DownloadZipButton
                  folder={folder}
                  size="compact-sm"
                  selection={downloadSelection}
                  selectionCount={hasCriteria ? results.totalCount : undefined}
                  selectionKind="results"
                  selectionDisabled={reviewChanged}
                  selectionUnavailableReason={
                    reviewChanged ? t('download.refreshRequired') : undefined
                  }
                />
              ) : null}
              {results && me?.isUser ? (
                <Tooltip
                  label={t('download.refreshRequired')}
                  disabled={!reviewChanged}
                  withArrow
                >
                  <Button
                    variant="default"
                    size="compact-sm"
                    leftSection={<CsvExportIcon size={16} />}
                    disabled={reviewChanged}
                    onClick={onCsvExport}
                  >
                    {t('folder.csv.action', { ns: 'admin' })}
                  </Button>
                </Tooltip>
              ) : null}
            </Group>
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
          {reviewChanged ? (
            <Alert variant="light" color="yellow" py="xs">
              <Group justify="space-between" gap="xs">
                <Text size="sm" aria-live="polite">
                  {reviewStatus.noLongerMatch > 0
                    ? t('results.noLongerMatch', {
                        count: reviewStatus.noLongerMatch,
                      })
                    : t('results.reviewChanges', {
                        count: reviewStatus.sortChanged,
                      })}
                </Text>
                <Button
                  variant="subtle"
                  color="yellow"
                  size="compact-sm"
                  loading={refreshingSession}
                  onClick={onRefresh}
                >
                  {t('results.refresh')}
                </Button>
              </Group>
            </Alert>
          ) : null}
        </Stack>
      </Paper>
    </Container>
  );
};
