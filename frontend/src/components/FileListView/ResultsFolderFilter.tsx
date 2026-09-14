import {
  ActionIcon,
  Button,
  Checkbox,
  Divider,
  Group,
  Loader,
  Popover,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import type { MediaResultsInput, MediaResultsQuery } from '@shared/gql/graphql';
import { mediaFolderFacetsQuery } from '@shared/urql/queries/mediaResultsQuery';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClient, useQuery } from 'urql';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  FoldersIcon,
  PreviousIcon,
} from '../../PicrIcons';

type FolderFacet =
  MediaResultsQuery['mediaResults']['folderFacets']['facets'][number];
type SelectedFolder =
  MediaResultsQuery['mediaResults']['selectedFolders'][number];
type FacetPage = MediaResultsQuery['mediaResults']['folderFacets'];

interface FolderLevel {
  id: string | null;
  name: string;
}

interface AdditionalFacets {
  facets: FolderFacet[];
  pageInfo: FacetPage['pageInfo'];
}

export const ResultsFolderFilter = ({
  input,
  selectionFingerprint,
  rootFolderName,
  rootPage,
  selectedFolders,
  folderIds,
  onChange,
}: {
  input: MediaResultsInput;
  selectionFingerprint: string;
  rootFolderName: string;
  rootPage: FacetPage;
  selectedFolders: SelectedFolder[];
  folderIds: string[];
  onChange: (folderIds: string[]) => void;
}) => {
  const { t } = useTranslation('gallery');
  const client = useClient();
  const [opened, setOpened] = useState(false);
  const [levels, setLevels] = useState<FolderLevel[]>([
    { id: null, name: rootFolderName },
  ]);
  const [additionalPages, setAdditionalPages] = useState<
    ReadonlyMap<string, AdditionalFacets>
  >(() => new Map());
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const currentLevel = levels.at(-1) ?? { id: null, name: rootFolderName };
  const facetCriteriaKey = useMemo(
    () =>
      JSON.stringify({
        folderId: input.folderId,
        query: input.query,
        filters: { ...input.filters, folderIds: undefined },
      }),
    [input],
  );
  const pageKey = `${facetCriteriaKey}:${currentLevel.id ?? 'root'}`;
  const [drillResult] = useQuery({
    query: mediaFolderFacetsQuery,
    variables: {
      input,
      parentFolderId: currentLevel.id,
      first: 100,
    },
    pause: currentLevel.id === null || !opened,
  });
  const basePage =
    currentLevel.id === null
      ? rootPage
      : drillResult.data?.mediaResults.folderFacets;
  const matchingAdditional = additionalPages.get(pageKey);
  const facets = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...(basePage?.facets ?? []),
      ...(matchingAdditional?.facets ?? []),
    ].filter(({ folder }) => {
      if (seen.has(folder.id)) return false;
      seen.add(folder.id);
      return true;
    });
  }, [basePage?.facets, matchingAdditional?.facets]);
  const pageInfo = matchingAdditional?.pageInfo ?? basePage?.pageInfo;
  const selectedIds = useMemo(() => new Set(folderIds), [folderIds]);
  const includedBySelectedAncestor = levels.some(
    ({ id }) => id !== null && selectedIds.has(id),
  );

  const toggleFolder = (folderId: string) => {
    onChange(
      selectedIds.has(folderId)
        ? folderIds.filter((id) => id !== folderId)
        : [...folderIds, folderId],
    );
  };

  const loadMore = async () => {
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) return;
    setLoadingMore(true);
    setLoadMoreError(false);
    const response = await client
      .query(
        mediaFolderFacetsQuery,
        {
          input,
          parentFolderId: currentLevel.id,
          first: 100,
          after: pageInfo.endCursor,
        },
        { requestPolicy: 'network-only' },
      )
      .toPromise();
    setLoadingMore(false);
    const next = response.data?.mediaResults;
    if (response.error || next?.selectionFingerprint !== selectionFingerprint) {
      setLoadMoreError(true);
      return;
    }
    setAdditionalPages((current) => {
      const nextPages = new Map(current);
      nextPages.set(pageKey, {
        facets: [
          ...(current.get(pageKey)?.facets ?? []),
          ...next.folderFacets.facets,
        ],
        pageInfo: next.folderFacets.pageInfo,
      });
      return nextPages;
    });
  };

  if (!rootPage.facets.length && !selectedFolders.length) return null;

  return (
    <Group gap={6} wrap="wrap">
      <Popover
        opened={opened}
        onChange={setOpened}
        width={340}
        position="bottom-start"
        shadow="md"
        withArrow
      >
        <Popover.Target>
          <Button
            variant={folderIds.length ? 'light' : 'default'}
            size="compact-sm"
            leftSection={<FoldersIcon size={15} />}
            rightSection={<ChevronDownIcon size={14} />}
            onClick={() => setOpened((value) => !value)}
            aria-expanded={opened}
          >
            {folderIds.length ? t('results.folders') : t('results.allFolders')}
          </Button>
        </Popover.Target>
        <Popover.Dropdown p={0}>
          <Group p="xs" gap="xs" wrap="nowrap">
            {levels.length > 1 ? (
              <ActionIcon
                variant="subtle"
                onClick={() => {
                  setLevels((current) => current.slice(0, -1));
                  setLoadMoreError(false);
                }}
                aria-label={t('results.folderBack')}
              >
                <PreviousIcon />
              </ActionIcon>
            ) : null}
            <Stack gap={0} flex={1} miw={0}>
              <Text size="xs" c="dimmed">
                {t('results.narrowByFolder')}
              </Text>
              <Text size="sm" fw={600} truncate>
                {currentLevel.name}
              </Text>
            </Stack>
            {folderIds.length ? (
              <Button
                variant="subtle"
                size="compact-xs"
                onClick={() => onChange([])}
              >
                {t('filter.clearNone')}
              </Button>
            ) : null}
          </Group>
          <Divider />
          <ScrollArea.Autosize mah={360}>
            <Stack gap={2} p="xs">
              {drillResult.fetching && !basePage ? (
                <Group justify="center" py="lg">
                  <Loader size="sm" />
                </Group>
              ) : null}
              {drillResult.error && !basePage ? (
                <Text size="sm" c="red" ta="center" py="md">
                  {t('results.folderLoadError')}
                </Text>
              ) : null}
              {basePage && !facets.length ? (
                <Text size="sm" c="dimmed" ta="center" py="md">
                  {t('results.noNarrowerFolders')}
                </Text>
              ) : null}
              {facets.map((facet) => (
                <Group key={facet.folder.id} gap={4} wrap="nowrap">
                  <Checkbox
                    checked={
                      includedBySelectedAncestor ||
                      selectedIds.has(facet.folder.id)
                    }
                    disabled={includedBySelectedAncestor}
                    onChange={() => toggleFolder(facet.folder.id)}
                    aria-label={t('results.includeFolder', {
                      folder: facet.folder.name,
                    })}
                  />
                  <Button
                    variant="subtle"
                    color="gray"
                    fullWidth
                    justify="space-between"
                    px="xs"
                    rightSection={<ChevronRightIcon size={15} />}
                    onClick={() => {
                      setLevels((current) => [
                        ...current,
                        { id: facet.folder.id, name: facet.folder.name },
                      ]);
                      setLoadMoreError(false);
                    }}
                    aria-label={t('results.browseFolder', {
                      folder: facet.folder.name,
                    })}
                  >
                    <Group gap="xs" wrap="nowrap" miw={0}>
                      <Text size="sm" truncate>
                        {facet.folder.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {facet.count}
                      </Text>
                    </Group>
                  </Button>
                </Group>
              ))}
              {loadMoreError ? (
                <Text size="xs" c="red" ta="center">
                  {t('results.folderLoadError')}
                </Text>
              ) : null}
              {pageInfo?.hasNextPage ? (
                <Button
                  variant="subtle"
                  size="compact-sm"
                  loading={loadingMore}
                  onClick={() => void loadMore()}
                >
                  {t('results.loadMoreFolders')}
                </Button>
              ) : null}
            </Stack>
          </ScrollArea.Autosize>
        </Popover.Dropdown>
      </Popover>

      {selectedFolders.map((folder) => (
        <Button
          key={folder.id}
          variant="light"
          size="compact-sm"
          rightSection={<CloseIcon size={14} />}
          onClick={() => toggleFolder(folder.id)}
          aria-label={t('filter.remove', { filter: folder.name })}
        >
          {folder.name}
        </Button>
      ))}
    </Group>
  );
};
