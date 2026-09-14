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
  MediaResultEdgeFragmentFragment,
  MediaResultsInput,
  MediaResultsPageFragmentFragment,
  MediaResultsQuery,
} from '@shared/gql/graphql';
import type { SelectedView } from '@shared/types/ui';
import {
  mediaResultAnchorQuery,
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
import { resultsReviewStatus } from '../../helpers/resultsReviewStatus';
import { useSubscribedMediaResultPages } from '../../hooks/useSubscribedMediaResultPages';
import { useResultsReviewBaseline } from '../../hooks/useResultsReviewBaseline';

const loadSelectedFileView = () =>
  import('./SelectedFile/SelectedFileView').then((module) => ({
    default: module.SelectedFileView,
  }));

const SelectedFileView = lazy(loadSelectedFileView);

type ResultsPage = MediaResultsPageFragmentFragment;
type ResultsConnection = MediaResultsQuery['mediaResults'];

interface ResultsAnchorState {
  requestKey: string;
  edge: MediaResultEdgeFragmentFragment;
}

interface ResultsRefreshSnapshot {
  requestKey: string;
  initial: ResultsConnection;
  pages: ResultsPage[];
}

interface ResultsRefreshError {
  requestKey: string;
  message: string;
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
  const [sessionRevision, setSessionRevision] = useState(0);
  const [refreshingSessionKey, setRefreshingSessionKey] = useState<
    string | null
  >(null);
  const [refreshSnapshot, setRefreshSnapshot] =
    useState<ResultsRefreshSnapshot | null>(null);
  const [refreshErrorState, setRefreshErrorState] =
    useState<ResultsRefreshError | null>(null);
  const [anchorState, setAnchorState] = useState<ResultsAnchorState | null>(
    null,
  );
  const initial = result.data?.mediaResults;
  const nextPages = useSubscribedMediaResultPages({
    client,
    input,
    requestKey,
    selectionFingerprint: initial?.selectionFingerprint,
    changedMessage: t('results.changed'),
  });
  const activeRefreshSnapshot =
    refreshSnapshot?.requestKey === requestKey ? refreshSnapshot : undefined;
  const displayedInitial = activeRefreshSnapshot?.initial ?? initial;
  const displayedNextPages = activeRefreshSnapshot?.pages ?? nextPages.pages;
  const refreshError =
    refreshErrorState?.requestKey === requestKey
      ? refreshErrorState.message
      : null;
  const materializedEdges = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...(displayedInitial?.edges ?? []),
      ...displayedNextPages.flatMap(({ edges }) => edges),
    ].filter((edge) => {
      if (seen.has(edge.file.id)) return false;
      seen.add(edge.file.id);
      return true;
    });
  }, [displayedInitial?.edges, displayedNextPages]);
  const files = useMemo<ViewFolderFileWithHero[]>(
    () => materializedEdges.map((edge) => edge.file),
    [materializedEdges],
  );
  const fileContexts = useMemo(
    () =>
      new Map(
        materializedEdges.map((edge) => [
          edge.file.id,
          {
            folderId: edge.folder.id,
            folderName: edge.folder.name,
            relativePath: edge.relativePath,
            matchSource: edge.matchSource,
          },
        ]),
      ),
    [materializedEdges],
  );
  const pageInfo =
    displayedNextPages.at(-1)?.pageInfo ?? displayedInitial?.pageInfo;
  const loadMoreError = [...nextPages.errors.values()].at(-1) ?? null;
  const loadMore = useCallback(() => {
    if (loadMoreError) {
      nextPages.retry();
      return;
    }
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) return;
    nextPages.requestPage(pageInfo.endCursor);
  }, [loadMoreError, nextPages, pageInfo]);

  const currentAnchor =
    anchorState?.requestKey === requestKey ? anchorState.edge : undefined;
  const anchorPages = useSubscribedMediaResultPages({
    client,
    input,
    requestKey: currentAnchor
      ? `${requestKey}:anchor:${currentAnchor.cursor}`
      : `${requestKey}:anchor`,
    selectionFingerprint: currentAnchor
      ? initial?.selectionFingerprint
      : undefined,
    initialCursor: currentAnchor?.cursor,
    changedMessage: t('results.changed'),
  });
  const anchorEdges = useMemo(
    () =>
      currentAnchor
        ? [currentAnchor, ...anchorPages.pages.flatMap(({ edges }) => edges)]
        : [],
    [anchorPages.pages, currentAnchor],
  );
  const selectedFileIsInResults = selectedFileId
    ? materializedEdges.some(({ file }) => file.id === selectedFileId)
    : false;
  const selectedFileIsInAnchorSequence = selectedFileId
    ? anchorEdges.some(({ file }) => file.id === selectedFileId)
    : false;
  const [anchorResult] = useQuery({
    query: mediaResultAnchorQuery,
    variables: { input, fileId: selectedFileId ?? '' },
    pause:
      !initial ||
      !selectedFileId ||
      selectedFileIsInResults ||
      selectedFileIsInAnchorSequence,
    requestPolicy: 'cache-and-network',
  });
  const anchorConnection = anchorResult.data?.mediaResults;
  const anchorResponseFileId = anchorResult.operation?.variables.fileId;
  const anchorResponseIsCurrent = anchorResponseFileId === selectedFileId;
  const queriedAnchor =
    initial &&
    anchorResponseIsCurrent &&
    anchorConnection?.selectionFingerprint === initial.selectionFingerprint
      ? anchorConnection.anchor
      : undefined;
  if (
    queriedAnchor &&
    (anchorState?.requestKey !== requestKey ||
      anchorState.edge.cursor !== queriedAnchor.cursor)
  ) {
    setAnchorState({ requestKey, edge: queriedAnchor });
  }

  const useAnchorSequence =
    !selectedFileIsInResults && selectedFileIsInAnchorSequence;
  const lightboxEdges = useAnchorSequence ? anchorEdges : materializedEdges;
  const lightboxFiles = useMemo<ViewFolderFileWithHero[]>(
    () => lightboxEdges.map(({ file }) => file),
    [lightboxEdges],
  );
  const lightboxContexts = useMemo(
    () =>
      useAnchorSequence
        ? new Map(
            lightboxEdges.map((edge) => [
              edge.file.id,
              {
                folderId: edge.folder.id,
                folderName: edge.folder.name,
                relativePath: edge.relativePath,
                matchSource: edge.matchSource,
              },
            ]),
          )
        : fileContexts,
    [fileContexts, lightboxEdges, useAnchorSequence],
  );
  const anchorPageInfo = anchorPages.pages.at(-1)?.pageInfo;
  const loadMoreAnchorResults = useCallback(() => {
    const error = [...anchorPages.errors.values()].at(-1);
    if (error) {
      anchorPages.retry();
      return;
    }
    if (!anchorPageInfo?.hasNextPage || !anchorPageInfo.endCursor) return;
    anchorPages.requestPage(anchorPageInfo.endCursor);
  }, [anchorPageInfo, anchorPages]);

  const reviewFiles = useMemo(() => {
    const byId = new Map(files.map((file) => [file.id, file]));
    for (const file of lightboxFiles) byId.set(file.id, file);
    return [...byId.values()];
  }, [files, lightboxFiles]);
  const baseline = useResultsReviewBaseline(
    `${requestKey}:${sessionRevision}`,
    reviewFiles,
  );
  const reviewStatus = useMemo(
    () => resultsReviewStatus(reviewFiles, baseline, filters, sort),
    [baseline, filters, reviewFiles, sort],
  );
  const refreshSession = useCallback(async () => {
    if (!initial) return;
    setRefreshingSessionKey(requestKey);
    setRefreshErrorState(null);
    setRefreshSnapshot({ requestKey, initial, pages: nextPages.pages });
    const scrollY = window.scrollY;
    const requestedAdditionalPages = nextPages.cursors.length;
    const finishRefresh = () => {
      setRefreshingSessionKey((current) =>
        current === requestKey ? null : current,
      );
      setRefreshSnapshot((current) =>
        current?.requestKey === requestKey ? null : current,
      );
      window.requestAnimationFrame(() => window.scrollTo({ top: scrollY }));
    };
    const fallBackToFirstPage = (
      refreshedInitial: ResultsConnection,
      message: string,
    ) => {
      nextPages.replacePages([]);
      setAnchorState(null);
      setSessionRevision((current) => current + 1);
      setRefreshErrorState({ requestKey, message });
      finishRefresh();
      if (
        refreshedInitial.pageInfo.hasNextPage &&
        refreshedInitial.pageInfo.endCursor
      ) {
        nextPages.requestPage(refreshedInitial.pageInfo.endCursor);
      }
    };
    const response = await client
      .query(mediaResultsQuery, { input }, { requestPolicy: 'network-only' })
      .toPromise();
    if (response.error) {
      setRefreshErrorState({ requestKey, message: response.error.message });
      finishRefresh();
      return;
    }
    const refreshedInitial = response.data?.mediaResults;
    if (!refreshedInitial) {
      setRefreshErrorState({ requestKey, message: t('results.changed') });
      finishRefresh();
      return;
    }

    const refreshedPages: Array<{ after: string; page: ResultsPage }> = [];
    let refreshedPageInfo = refreshedInitial.pageInfo;
    for (
      let pageIndex = 0;
      pageIndex < requestedAdditionalPages &&
      refreshedPageInfo.hasNextPage &&
      refreshedPageInfo.endCursor;
      pageIndex += 1
    ) {
      const after = refreshedPageInfo.endCursor;
      const nextResponse = await client
        .query(
          mediaResultsNextPageQuery,
          { input: { ...input, after } },
          { requestPolicy: 'network-only' },
        )
        .toPromise();
      if (nextResponse.error || !nextResponse.data?.mediaResults) {
        fallBackToFirstPage(
          refreshedInitial,
          nextResponse.error?.message ?? t('results.changed'),
        );
        return;
      }
      const page = nextResponse.data.mediaResults;
      if (page.selectionFingerprint !== refreshedInitial.selectionFingerprint) {
        fallBackToFirstPage(refreshedInitial, t('results.changed'));
        return;
      }
      refreshedPages.push({ after, page });
      refreshedPageInfo = page.pageInfo;
    }
    nextPages.replacePages(refreshedPages);
    setAnchorState(null);
    setSessionRevision((current) => current + 1);
    finishRefresh();
  }, [client, initial, input, nextPages, requestKey, t]);
  const selectedFileNoLongerMatches =
    !!selectedFileId &&
    !selectedFileIsInResults &&
    !selectedFileIsInAnchorSequence &&
    anchorResponseIsCurrent &&
    !anchorResult.fetching &&
    !anchorResult.error &&
    !!anchorConnection &&
    anchorConnection.anchor === null;
  const { ref: loadMoreRef } = useInView({
    rootMargin: '800px 0px',
    onChange: (inView) => {
      if (inView && !loadMoreError) loadMore();
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
      displayedInitial && displayedInitial.folderCount > 1
        ? fileContexts
        : undefined,
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
        results={displayedInitial}
        localFiltersPaused={hasLocalOnlyGalleryFilters(filters)}
        reviewStatus={reviewStatus}
        refreshingSession={refreshingSessionKey === requestKey}
        onQueryChange={setResultsQuery}
        onFiltersChange={setFilters}
        onFolderIdsChange={setResultFolderIds}
        onClear={clearResultsCriteria}
        onBack={exitResults}
        onRefresh={() => void refreshSession()}
      />

      {selectedFileNoLongerMatches ? (
        <Page>
          <Alert variant="light" color="yellow">
            <Stack gap="xs" align="flex-start">
              <Text>{t('results.selectedFileNoLongerMatches')}</Text>
              <Button
                variant="subtle"
                color="yellow"
                size="compact-sm"
                onClick={() => setSelectedFileId(undefined)}
              >
                {t('results.returnToResults')}
              </Button>
            </Stack>
          </Alert>
        </Page>
      ) : null}

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
      {displayedInitial?.totalCount === 0 ? (
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

      {selectedFileId &&
      (selectedFileIsInResults || selectedFileIsInAnchorSequence) ? (
        <Suspense fallback={null}>
          <SelectedFileView
            files={lightboxFiles}
            setSelectedFileId={setSelectedFileId}
            selectedFileId={selectedFileId}
            folderId={folder.id}
            resultFileContexts={lightboxContexts}
            totalFiles={
              useAnchorSequence ? undefined : displayedInitial?.totalCount
            }
            showCounter={!useAnchorSequence}
            onApproachingEnd={
              useAnchorSequence ? loadMoreAnchorResults : loadMore
            }
          />
        </Suspense>
      ) : null}
      {view === 'list' && <FileListView {...listProps} />}
      {view === 'gallery' && <GridGallery {...visualCollectionProps} />}
      {view === 'feed' && <ImageFeed {...visualCollectionProps} />}

      {refreshError || loadMoreError ? (
        <Page>
          <Alert variant="filled" color="red">
            {refreshError ?? loadMoreError}
          </Alert>
        </Page>
      ) : null}
      {pageInfo?.hasNextPage ? (
        <Center ref={loadMoreRef} pb="xl" mih={80}>
          <Button loading={nextPages.loading} onClick={loadMore}>
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
