import { useMemo, useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import type { ViewFolder } from '@shared/files/sortFiles';
import { defaultGalleryFilterCriteria } from '@shared/files/mediaCriteria';
import { filterFiles } from '@shared/files/filterFiles';
import { sortFiles } from '@shared/files/sortFiles';
import { MediaTextExportFormat } from '@shared/gql/graphql';
import { generateMediaTextExportMutation } from '@shared/urql/mutations/generateMediaTextExportMutation';
import { mediaMatchSummaryQuery } from '@shared/urql/queries/mediaResultsQuery';
import { useMutation, useQuery } from 'urql';
import { useFileSort } from '../../hooks/useFileSort';
import { useGalleryCriteria } from '../../hooks/useGalleryCriteria';
import { copyToClipboard } from '../../helpers/copyToClipboard';
import { anchorDownload } from '../../helpers/shareOrDownload';
import { withBasePath } from '../../helpers/baseHref';
import {
  hasLocalOnlyGalleryFilters,
  mediaResultsSelectionInput,
} from '../../helpers/mediaResultsInput';
import { ClipboardIcon, DownloadIcon } from '../../PicrIcons';
import { useTranslation } from 'react-i18next';

type ExportFormat = 'picr' | 'comma' | 'space';

const stripExtensionFromPath = (path: string) => {
  const lastSlash = path.lastIndexOf('/');
  const prefix = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : '';
  const base = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  return prefix + base.replace(/\.[^.]+$/, '');
};

const flagForCsv = (flag: string | null | undefined) => {
  if (flag === 'approved') return 'approved';
  if (flag === 'rejected') return 'rejected';
  return '';
};

const csvValue = (value: string | number) => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const formatLabelKey = (format: ExportFormat) => {
  if (format === 'comma') return 'folder.csv.format.comma' as const;
  if (format === 'space') return 'folder.csv.format.space' as const;
  return 'folder.csv.format.picr' as const;
};

const graphqlFormat: Record<ExportFormat, MediaTextExportFormat> = {
  picr: MediaTextExportFormat.Picr,
  comma: MediaTextExportFormat.Comma,
  space: MediaTextExportFormat.Space,
};

export const FolderCsvExportModal = ({
  folder,
  opened,
  onClose,
}: {
  folder: ViewFolder | null | undefined;
  opened: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation('admin');
  const [sort] = useFileSort();
  const { mode, query, filters, folderIds } = useGalleryCriteria();
  const [format, setFormat] = useState<ExportFormat>('picr');
  const [excludeExtensions, setExcludeExtensions] = useState(false);
  const [useFilters, setUseFilters] = useState(true);
  const [includeSubfolders, setIncludeSubfolders] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const folderId = folder?.id;
  const recursiveExport = mode === 'results' || includeSubfolders;
  // Results always export their displayed criteria. `useFilters` is a Gallery
  // option and may retain its previous value if browser history changes mode
  // while this modal is open.
  const applyCriteria = mode === 'results' || useFilters;
  const activeFilters = applyCriteria ? filters : defaultGalleryFilterCriteria;
  const metadataBlocksRecursiveExport =
    mode === 'gallery' &&
    recursiveExport &&
    useFilters &&
    hasLocalOnlyGalleryFilters(filters);
  const selection = useMemo(
    () =>
      folderId
        ? mediaResultsSelectionInput({
            folderId,
            query: mode === 'results' ? query : '',
            filters: activeFilters,
            folderIds: mode === 'results' ? folderIds : undefined,
            directOnly: !recursiveExport,
          })
        : null,
    [activeFilters, folderId, folderIds, mode, query, recursiveExport],
  );
  const [summary] = useQuery({
    query: mediaMatchSummaryQuery,
    variables: {
      input:
        selection ??
        mediaResultsSelectionInput({
          folderId: '1',
          filters: defaultGalleryFilterCriteria,
        }),
    },
    pause: !opened || !selection || !recursiveExport,
  });
  const [artifactResult, generateArtifact] = useMutation(
    generateMediaTextExportMutation,
  );

  const localFiles = useMemo(() => {
    const direct = folder?.files ?? [];
    const filtered = useFilters ? filterFiles(direct, filters) : direct;
    return sortFiles(filtered, sort);
  }, [folder?.files, filters, sort, useFilters]);
  const localOutput = useMemo(() => {
    const names = localFiles.map((file) =>
      excludeExtensions ? stripExtensionFromPath(file.name) : file.name,
    );
    if (format === 'comma') return names.join(',');
    if (format === 'space') return names.join(' ');
    return localFiles
      .map((file, index) =>
        [
          csvValue(names[index] ?? ''),
          csvValue(file.rating ?? ''),
          csvValue(flagForCsv(file.flag)),
        ].join(','),
      )
      .join('\n');
  }, [excludeExtensions, format, localFiles]);

  const remoteCount = summary.data?.mediaMatchSummary.treeCount;
  const fileCount = recursiveExport ? remoteCount : localFiles.length;
  const extension = format === 'picr' ? 'csv' : 'txt';
  const localFileName = `${(folder?.name ?? 'folder').replace(/[^\w.-]+/g, '_')}-export.${extension}`;
  const blocked = metadataBlocksRecursiveExport || !selection;

  const createArtifact = async () => {
    if (!selection || metadataBlocksRecursiveExport) return null;
    const response = await generateArtifact({
      input: selection,
      format: graphqlFormat[format],
      excludeExtensions,
    });
    const artifact = response.data?.generateMediaTextExport;
    if (!artifact) {
      setActionError(response.error?.message ?? t('folder.csv.loadError'));
      return null;
    }
    return {
      ...artifact,
      url: withBasePath(
        `/export/${folderId}/${artifact.token}/${encodeURIComponent(artifact.filename)}`,
      ),
    };
  };

  const handleCopy = async () => {
    if (!recursiveExport) {
      if (localOutput) copyToClipboard(localOutput);
      return;
    }
    const artifact = await createArtifact();
    if (!artifact) return;
    const response = await fetch(artifact.url);
    if (!response.ok) throw new Error(t('folder.csv.loadError'));
    copyToClipboard(await response.text());
  };

  const handleDownload = async () => {
    if (!recursiveExport) {
      if (!localOutput) return;
      const blob = new Blob([localOutput], {
        type: 'text/plain;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      anchorDownload(url, localFileName);
      URL.revokeObjectURL(url);
      return;
    }
    const artifact = await createArtifact();
    if (artifact) anchorDownload(artifact.url, artifact.filename);
  };

  const runAction = async (action: () => Promise<void>) => {
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t('folder.csv.loadError'),
      );
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('folder.csv.title')}
      size="lg"
    >
      <Stack gap="md">
        <Select
          label={t('folder.csv.formatLabel')}
          value={format}
          onChange={(value) => setFormat((value ?? 'picr') as ExportFormat)}
          data={(['picr', 'comma', 'space'] as ExportFormat[]).map((value) => ({
            value,
            label: t(formatLabelKey(value)),
          }))}
          allowDeselect={false}
        />

        {format === 'picr' ? (
          <Text size="sm" c="dimmed">
            {t('folder.csv.pluginPrefix')}{' '}
            <Anchor href="/picr-lightroom-plugin.zip" download>
              {t('folder.csv.pluginName')}
            </Anchor>
            .
          </Text>
        ) : null}

        <Checkbox
          checked={excludeExtensions}
          onChange={(event) =>
            setExcludeExtensions(event.currentTarget.checked)
          }
          label={t('folder.csv.excludeExtensions')}
        />
        {mode === 'gallery' ? (
          <>
            <Checkbox
              checked={useFilters}
              onChange={(event) => setUseFilters(event.currentTarget.checked)}
              label={t('folder.csv.useFilters')}
            />
            <Checkbox
              checked={includeSubfolders}
              onChange={(event) =>
                setIncludeSubfolders(event.currentTarget.checked)
              }
              label={t('folder.csv.includeSubfolders')}
              description={t('folder.csv.includeSubfoldersDescription')}
            />
          </>
        ) : (
          <Text size="sm" c="dimmed">
            {t('folder.csv.resultsSelection')}
          </Text>
        )}

        {metadataBlocksRecursiveExport ? (
          <Alert color="yellow" variant="light">
            {t('folder.csv.metadataUnavailable')}
          </Alert>
        ) : null}
        {recursiveExport ? (
          <Text size="sm" c="dimmed" aria-live="polite">
            {summary.error
              ? t('folder.csv.loadError')
              : summary.fetching || fileCount === undefined
                ? t('folder.csv.loadingSubfolders')
                : t('folder.csv.previewCount', { count: fileCount })}
          </Text>
        ) : (
          <Textarea
            value={localOutput}
            readOnly
            minRows={6}
            autosize
            placeholder={t('folder.csv.empty')}
          />
        )}
        {artifactResult.error || actionError ? (
          <Alert color="red" variant="light">
            {actionError ?? artifactResult.error?.message}
          </Alert>
        ) : null}

        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={() => void runAction(handleCopy)}
            disabled={blocked || fileCount === 0}
            loading={artifactResult.fetching}
            leftSection={<ClipboardIcon />}
          >
            {t('folder.csv.copy')}
          </Button>
          <Button
            onClick={() => void runAction(handleDownload)}
            disabled={blocked || fileCount === 0}
            loading={artifactResult.fetching}
            leftSection={<DownloadIcon />}
          >
            {t('folder.csv.download')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
