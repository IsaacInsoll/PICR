import {
  Alert,
  Button,
  Center,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core';
import type {
  ViewFolder,
  ViewFolderFileWithHero,
} from '@shared/files/sortFiles';
import type {
  MediaResultsInput,
  MediaResultsPageFragmentFragment,
} from '@shared/gql/graphql';
import type { SelectedView } from '@shared/types/ui';
import {
  mediaResultsNextPageQuery,
  mediaResultsQuery,
} from '@shared/urql/queries/mediaResultsQuery';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClient, useQuery } from 'urql';
import { stripUrqlErrorPrefixes } from '@shared/urql/stripUrqlErrorPrefixes';
import {
  hasLocalOnlyGalleryFilters,
  mediaResultsFilterInput,
  mediaResultsSortInput,
} from '../../helpers/mediaResultsInput';
import { useFileSort } from '../../hooks/useFileSort';
import { useGalleryCriteria } from '../../hooks/useGalleryCriteria';
import { useFolderNameFormatter } from '../../i18n/useFolderNameFormatter';
import { LoadingIndicator } from '../LoadingIndicator';
import { Page } from '../Page';
import { PreviousIcon } from '../../PicrIcons';
import { FileListView } from './FileListView';
import type { FileListViewStyleComponentProps } from './FolderContentsView';
import { GridGallery } from './GridGallery';
import { ImageFeed } from './ImageFeed';

const loadSelectedFileView = () =>
  import('./SelectedFile/SelectedFileView').then((module) => ({
    default: module.SelectedFileView,
  }));

const SelectedFileView = lazy(loadSelectedFileView);

type ResultsPage = MediaResultsPageFragmentFragment;

interface LoadedNextPages {
  selectionFingerprint: string;
  edges: ResultsPage['edges'];
  pageInfo: ResultsPage['pageInfo'];
}

export const GalleryResultsView = ({
  folder,
  selectedFileId,
  setSelectedFileId,
  view,
  width,
}: {
  folder: ViewFolder;
  selectedFileId?: string;
  setSelectedFileId: (id: string | undefined) => void;
  view: SelectedView;
  width: number;
}) => {
  const { t } = useTranslation('gallery');
  const formatFolderName = useFolderNameFormatter();
  const client = useClient();
  const [sort] = useFileSort();
  const { query, folderIds, filters, exitResults } = useGalleryCriteria(
    folder.id,
  );
  const input = useMemo<MediaResultsInput>(
    () => ({
      folderId: folder.id,
      query: query || undefined,
      filters: {
        ...mediaResultsFilterInput(filters),
        folderIds: folderIds.length ? folderIds : undefined,
      },
      sort: mediaResultsSortInput(sort),
      first: 100,
    }),
    [filters, folder.id, folderIds, query, sort],
  );
  const [result, retryResults] = useQuery({
    query: mediaResultsQuery,
    variables: { input },
  });
  const [nextPages, setNextPages] = useState<LoadedNextPages | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const initial = result.data?.mediaResults;
  const matchingNextPages =
    initial && nextPages?.selectionFingerprint === initial.selectionFingerprint
      ? nextPages
      : null;
  const edges = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...(initial?.edges ?? []),
      ...(matchingNextPages?.edges ?? []),
    ].filter((edge) => {
      if (seen.has(edge.file.id)) return false;
      seen.add(edge.file.id);
      return true;
    });
  }, [initial?.edges, matchingNextPages?.edges]);
  const files: ViewFolderFileWithHero[] = edges.map((edge) => edge.file);
  const pageInfo = matchingNextPages?.pageInfo ?? initial?.pageInfo;

  const loadMore = async () => {
    if (!initial || !pageInfo?.hasNextPage || !pageInfo.endCursor) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    const response = await client
      .query(
        mediaResultsNextPageQuery,
        { input: { ...input, after: pageInfo.endCursor } },
        { requestPolicy: 'network-only' },
      )
      .toPromise();
    setLoadingMore(false);
    if (response.error) {
      setLoadMoreError(response.error.message);
      return;
    }
    const next = response.data?.mediaResults;
    if (next?.selectionFingerprint !== initial.selectionFingerprint) {
      setLoadMoreError(t('results.changed'));
      return;
    }
    setNextPages((current) => ({
      selectionFingerprint: next.selectionFingerprint,
      edges: [
        ...(current?.selectionFingerprint === next.selectionFingerprint
          ? current.edges
          : []),
        ...next.edges,
      ],
      pageInfo: next.pageInfo,
    }));
  };

  const galleryProps: FileListViewStyleComponentProps = {
    folderId: folder.id,
    folders: [],
    files,
    items: files,
    selectedFileId,
    setSelectedFileId,
    width,
  };

  return (
    <Stack gap="md">
      <Page>
        <Paper withBorder radius="md" px="sm" py="xs">
          <Group justify="space-between" gap="xs" wrap="wrap">
            <Button
              variant="subtle"
              size="compact-sm"
              leftSection={<PreviousIcon size={16} />}
              onClick={exitResults}
            >
              {t('results.backTo', { folder: formatFolderName(folder) })}
            </Button>
            {initial ? (
              <Text size="sm" c="dimmed" aria-live="polite">
                {t('count.file', { count: initial.totalCount })}
                {' · '}
                {t('count.folder', { count: initial.folderCount })}
              </Text>
            ) : null}
          </Group>
          {hasLocalOnlyGalleryFilters(filters) ? (
            <Alert variant="light" mt="xs" py="xs">
              {t('results.localFiltersPaused')}
            </Alert>
          ) : null}
        </Paper>
      </Page>

      {result.fetching && !initial ? (
        <Center py="xl">
          <LoadingIndicator size="large" />
        </Center>
      ) : null}
      {result.error && !initial ? (
        <Page>
          <Alert variant="filled" color="red">
            <Stack gap="xs" align="flex-start">
              <Text>{stripUrqlErrorPrefixes(result.error.message)}</Text>
              <Button
                variant="white"
                color="red"
                size="compact-sm"
                onClick={() => retryResults({ requestPolicy: 'network-only' })}
              >
                {t('error.retry')}
              </Button>
            </Stack>
          </Alert>
        </Page>
      ) : null}
      {initial?.totalCount === 0 ? (
        <Center py="xl">
          <Text c="dimmed">{t('results.empty')}</Text>
        </Center>
      ) : null}

      {selectedFileId ? (
        <Suspense fallback={null}>
          <SelectedFileView
            files={files}
            setSelectedFileId={setSelectedFileId}
            selectedFileId={selectedFileId}
            folderId={folder.id}
          />
        </Suspense>
      ) : null}
      {view === 'list' && <FileListView {...galleryProps} />}
      {view === 'gallery' && <GridGallery {...galleryProps} />}
      {view === 'feed' && <ImageFeed {...galleryProps} />}

      {loadMoreError ? (
        <Page>
          <Alert variant="filled" color="red">
            {loadMoreError}
          </Alert>
        </Page>
      ) : null}
      {pageInfo?.hasNextPage ? (
        <Center pb="xl">
          <Button loading={loadingMore} onClick={() => void loadMore()}>
            {t('results.loadMore')}
          </Button>
        </Center>
      ) : null}
    </Stack>
  );
};
