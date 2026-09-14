import {
  Alert,
  Button,
  Center,
  SimpleGrid,
  Skeleton,
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
import { useDebouncedValue } from '@mantine/hooks';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClient, useQuery } from 'urql';
import { useInView } from 'react-intersection-observer';
import { stripUrqlErrorPrefixes } from '@shared/urql/stripUrqlErrorPrefixes';
import {
  hasLocalOnlyGalleryFilters,
  mediaResultsFilterInput,
  mediaResultsSortInput,
} from '../../helpers/mediaResultsInput';
import { useFileSort } from '../../hooks/useFileSort';
import { useGalleryCriteria } from '../../hooks/useGalleryCriteria';
import { useFolderNameFormatter } from '../../i18n/useFolderNameFormatter';
import { Page } from '../Page';
import { FileListView } from './FileListView';
import type { FileListViewStyleComponentProps } from './FolderContentsView';
import { GridGallery } from './GridGallery';
import { ImageFeed } from './ImageFeed';
import { GalleryResultsBar } from './GalleryResultsBar';

const loadSelectedFileView = () =>
  import('./SelectedFile/SelectedFileView').then((module) => ({
    default: module.SelectedFileView,
  }));

const SelectedFileView = lazy(loadSelectedFileView);

type ResultsPage = MediaResultsPageFragmentFragment;

interface LoadedNextPages {
  requestKey: string;
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
  const {
    query,
    folderIds,
    filters,
    setFilters,
    setResultsQuery,
    setResultFolderIds,
    clearResultsCriteria,
    exitResults,
  } = useGalleryCriteria();
  const [debouncedQuery] = useDebouncedValue(query, 250);
  const input = useMemo<MediaResultsInput>(
    () => ({
      folderId: folder.id,
      query: debouncedQuery || undefined,
      filters: {
        ...mediaResultsFilterInput(filters),
        folderIds: folderIds.length ? folderIds : undefined,
      },
      sort: mediaResultsSortInput(sort),
      first: 100,
    }),
    [debouncedQuery, filters, folder.id, folderIds, sort],
  );
  const [result, retryResults] = useQuery({
    query: mediaResultsQuery,
    variables: { input },
  });
  const requestKey = useMemo(() => JSON.stringify(input), [input]);
  const [nextPages, setNextPages] = useState<LoadedNextPages | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const initial = result.data?.mediaResults;
  const matchingNextPages =
    initial && nextPages?.requestKey === requestKey ? nextPages : null;
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
  const fileContexts = useMemo(
    () =>
      new Map(
        edges.map((edge) => [
          edge.file.id,
          {
            relativePath: edge.relativePath,
            matchSource: edge.matchSource,
          },
        ]),
      ),
    [edges],
  );
  const pageInfo = matchingNextPages?.pageInfo ?? initial?.pageInfo;

  const loadMore = useCallback(async () => {
    if (
      loadingMore ||
      !initial ||
      !pageInfo?.hasNextPage ||
      !pageInfo.endCursor
    ) {
      return;
    }
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
      requestKey,
      selectionFingerprint: next.selectionFingerprint,
      edges: [
        ...(current?.requestKey === requestKey ? current.edges : []),
        ...next.edges,
      ],
      pageInfo: next.pageInfo,
    }));
  }, [client, initial, input, loadingMore, pageInfo, requestKey, t]);
  const { ref: loadMoreRef } = useInView({
    rootMargin: '800px 0px',
    onChange: (inView) => {
      if (inView && !loadMoreError) void loadMore();
    },
  });

  const galleryProps: FileListViewStyleComponentProps = {
    folderId: folder.id,
    folders: [],
    files,
    items: files,
    selectedFileId,
    setSelectedFileId,
    width,
  };

  const folderName = formatFolderName(folder) ?? folder.name;
  const listProps: FileListViewStyleComponentProps = {
    ...galleryProps,
    resultFileContexts: fileContexts,
    resultRootFolderName: folderName,
  };
  const visualCollectionProps: FileListViewStyleComponentProps = {
    ...galleryProps,
    resultFileContexts:
      initial && initial.folderCount > 1 ? fileContexts : undefined,
    resultRootFolderName: folderName,
  };

  return (
    <Stack gap="md">
      <GalleryResultsBar
        folderName={folderName}
        query={query}
        filters={filters}
        folderIds={folderIds}
        input={input}
        results={initial}
        localFiltersPaused={hasLocalOnlyGalleryFilters(filters)}
        onQueryChange={setResultsQuery}
        onFiltersChange={setFilters}
        onFolderIdsChange={setResultFolderIds}
        onClear={clearResultsCriteria}
        onBack={exitResults}
      />

      {result.fetching && !initial ? (
        <ResultsLoadingCollection view={view} />
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
      {result.error && initial ? (
        <Page>
          <Alert variant="light" color="red">
            <Stack gap="xs" align="flex-start">
              <Text>{stripUrqlErrorPrefixes(result.error.message)}</Text>
              <Button
                variant="subtle"
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
          <Stack align="center" gap="xs">
            <Text c="dimmed">
              {t('results.emptyWithin', { folder: folderName })}
            </Text>
            <Button variant="light" onClick={clearResultsCriteria}>
              {t('results.clearSearchAndFilters')}
            </Button>
          </Stack>
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
      {view === 'list' && <FileListView {...listProps} />}
      {view === 'gallery' && <GridGallery {...visualCollectionProps} />}
      {view === 'feed' && <ImageFeed {...visualCollectionProps} />}

      {loadMoreError ? (
        <Page>
          <Alert variant="filled" color="red">
            {loadMoreError}
          </Alert>
        </Page>
      ) : null}
      {pageInfo?.hasNextPage ? (
        <Center ref={loadMoreRef} pb="xl" mih={80}>
          <Button loading={loadingMore} onClick={() => void loadMore()}>
            {t('results.loadMore')}
          </Button>
        </Center>
      ) : null}
    </Stack>
  );
};

const ResultsLoadingCollection = ({ view }: { view: SelectedView }) => {
  if (view === 'feed') {
    return (
      <Page>
        <Stack gap="xl">
          {[0, 1].map((key) => (
            <Skeleton key={key} height={360} radius="md" />
          ))}
        </Stack>
      </Page>
    );
  }

  if (view === 'list') {
    return (
      <Page>
        <Stack gap="xs">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <Skeleton key={key} height={64} radius="sm" />
          ))}
        </Stack>
      </Page>
    );
  }

  return (
    <Page>
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="sm">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((key) => (
          <Skeleton key={key} height={180} radius="md" />
        ))}
      </SimpleGrid>
    </Page>
  );
};
