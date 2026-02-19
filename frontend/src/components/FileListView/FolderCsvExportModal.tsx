import { useMemo, useState } from 'react';
import {
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
import { useQuery } from 'urql';
import { useAtomValue } from 'jotai';
import { filterOptions } from '@shared/filterAtom';
import { filterFiles } from '@shared/files/filterFiles';
import { sortFiles } from '@shared/files/sortFiles';
import { folderFilesQuery } from '@shared/urql/queries/folderFilesQuery';
import { fileSortAtom } from '../../atoms/fileSortAtom';
import { copyToClipboard } from '../../helpers/copyToClipboard';
import type { ViewFolderQuery } from '@shared/gql/graphql';
import { ClipboardIcon, DownloadIcon } from '../../PicrIcons';

type Folder = ViewFolderQuery['folder'];
type ExportFormat = 'picr' | 'comma' | 'space';
type ExportFile = ViewFolderQuery['folder']['files'][number] & {
  relativePath?: string | null;
};

const MAX_EXPORT_FILES = 10000;

const stripExtensionFromPath = (path: string) => {
  const lastSlash = path.lastIndexOf('/');
  const prefix = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : '';
  const base = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
  const withoutExtension = base.replace(/\.[^.]+$/, '');
  return prefix + withoutExtension;
};

const flagForCsv = (flag: string | null | undefined) => {
  // avoid pushing none/null/undefined through
  if (flag === 'approved') return 'approved';
  if (flag === 'rejected') return 'rejected';
  return '';
};

const formatLabel = (format: ExportFormat) => {
  switch (format) {
    case 'picr':
      return 'PICR plugin CSV (filename, rating, flag)';
    case 'comma':
      return 'Lightroom (comma-separated)';
    case 'space':
      return 'Capture One & Photo Mechanic (space-separated)';
    default:
      return format;
  }
};

export const FolderCsvExportModal = ({
  folder,
  opened,
  onClose,
}: {
  folder: Folder | null | undefined;
  opened: boolean;
  onClose: () => void;
}) => {
  const filters = useAtomValue(filterOptions);
  const sort = useAtomValue(fileSortAtom);
  const [format, setFormat] = useState<ExportFormat>('picr');
  const [excludeExtensions, setExcludeExtensions] = useState(false);
  const [useFilters, setUseFilters] = useState(true);
  const [includeSubfolders, setIncludeSubfolders] = useState(false);

  const folderFilesVariables = useMemo(
    () => ({
      folderId: folder?.id ?? '',
      includeSubfolders: true,
      limit: MAX_EXPORT_FILES,
    }),
    [folder?.id],
  );
  const folderFilesContext = useMemo(() => ({ suspense: false }), []);

  const [{ data: folderFilesData, fetching: folderFilesLoading, error }] =
    useQuery({
      query: folderFilesQuery,
      variables: folderFilesVariables,
      context: folderFilesContext,
      pause: !opened || !includeSubfolders || !folder?.id,
    });

  const folderFilesResult = includeSubfolders
    ? folderFilesData?.folderFiles
    : null;

  const files = useMemo(() => {
    const folderFiles: ExportFile[] = includeSubfolders
      ? (folderFilesResult?.files ?? []).map((item) => ({
          ...item.file,
          relativePath: item.relativePath,
        }))
      : (folder?.files ?? []);
    const filtered = useFilters
      ? filterFiles(folderFiles, filters)
      : folderFiles;
    return sortFiles(filtered, sort) as ExportFile[];
  }, [folder, folderFilesResult, includeSubfolders, useFilters, filters, sort]);

  const output = useMemo(() => {
    const names = files.map((file) => {
      const base = includeSubfolders
        ? (file.relativePath ?? file.name ?? '')
        : (file.name ?? '');
      return excludeExtensions ? stripExtensionFromPath(base) : base;
    });

    if (format === 'comma') return names.join(',');
    if (format === 'space') return names.join(' ');

    return files
      .map((file, index) => {
        const name = names[index] ?? '';
        const rating = file.rating ?? '';
        const flag = flagForCsv(file.flag);
        return `${name},${rating},${flag}`;
      })
      .join('\n');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exclude includeSubfolders to avoid recomputing while folderFilesQuery is still stabilizing
  }, [files, format, excludeExtensions]);

  const fileCount = files.length;
  const downloadExtension = format === 'picr' ? 'csv' : 'txt';
  const fileNameBase = (folder?.name ?? 'folder').replace(/[^\w.-]+/g, '_');
  const downloadFileName = `${fileNameBase}-export.${downloadExtension}`;
  const outputLoading = includeSubfolders && folderFilesLoading;
  const displayOutput = outputLoading ? 'Loading...' : output;
  const outputDisabled = outputLoading || !output;

  const handleCopy = () => {
    if (!output) return;
    copyToClipboard(output);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Export filenames" size="lg">
      <Stack gap="md">
        <Select
          label="Export format"
          value={format}
          onChange={(value) => setFormat((value ?? 'picr') as ExportFormat)}
          data={(['picr', 'comma', 'space'] as ExportFormat[]).map((value) => ({
            value,
            label: formatLabel(value),
          }))}
          allowDeselect={false}
        />

        {format === 'picr' && (
          <Text size="sm" c="dimmed">
            Import this data into Lightroom Classic using the{' '}
            <Anchor href="/picr-lightroom-plugin.zip" download>
              PICR Lightroom Plugin
            </Anchor>
            .
          </Text>
        )}

        <Checkbox
          checked={excludeExtensions}
          onChange={(event) =>
            setExcludeExtensions(event.currentTarget.checked)
          }
          label="Exclude file extensions"
        />
        <Checkbox
          checked={useFilters}
          onChange={(event) => setUseFilters(event.currentTarget.checked)}
          label="Use current filters"
        />
        <Checkbox
          checked={includeSubfolders}
          onChange={(event) =>
            setIncludeSubfolders(event.currentTarget.checked)
          }
          label="Include subfolders"
          description="Export all files within the folder tree (max 10,000)"
        />

        {includeSubfolders ? (
          <Text
            size="sm"
            c={folderFilesResult?.truncated ? 'orange' : 'dimmed'}
          >
            {error
              ? 'Unable to load files from subfolders.'
              : folderFilesLoading
                ? 'Loading files from subfolders...'
                : folderFilesResult
                  ? `${folderFilesResult.totalReturned} of ${folderFilesResult.totalAvailable} files loaded` +
                    (folderFilesResult.truncated ? ' (truncated)' : '')
                  : 'No files found.'}
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            {fileCount} file{fileCount === 1 ? '' : 's'} in export preview
          </Text>
        )}

        <Textarea
          value={displayOutput}
          readOnly
          disabled={outputLoading}
          minRows={6}
          autosize
          placeholder="No files to export yet."
        />

        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={handleCopy}
            disabled={outputDisabled}
            leftSection={<ClipboardIcon />}
          >
            Copy to clipboard
          </Button>
          <Button
            onClick={handleDownload}
            disabled={outputDisabled}
            leftSection={<DownloadIcon />}
          >
            Download
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
