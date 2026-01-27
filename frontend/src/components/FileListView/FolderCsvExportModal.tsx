import { useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useAtomValue } from 'jotai';
import { filterOptions } from '@shared/filterAtom';
import { filterFiles } from '@shared/files/filterFiles';
import { sortFiles } from '@shared/files/sortFiles';
import { fileSortAtom } from '../../atoms/fileSortAtom';
import { copyToClipboard } from '../../helpers/copyToClipboard';
import type { ViewFolderQuery } from '@shared/gql/graphql';
import { ClipboardIcon, DownloadIcon } from '../../PicrIcons';

type Folder = ViewFolderQuery['folder'];
type ExportFormat = 'picr' | 'comma' | 'space';

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, '');

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
      return 'Comma-separated filenames';
    case 'space':
      return 'Space-separated filenames';
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

  const files = useMemo(() => {
    const folderFiles = folder?.files ?? [];
    const filtered = useFilters
      ? filterFiles(folderFiles, filters)
      : folderFiles;
    return sortFiles(filtered, sort);
  }, [folder, useFilters, filters, sort]);

  const output = useMemo(() => {
    const names = files.map((file) => {
      const base = file.name ?? '';
      return excludeExtensions ? stripExtension(base) : base;
    });

    if (format === 'comma') return names.join(', ');
    if (format === 'space') return names.join(' ');

    return files
      .map((file, index) => {
        const name = names[index] ?? '';
        const rating = file.rating ?? '';
        const flag = flagForCsv(file.flag);
        return `${name},${rating},${flag}`;
      })
      .join('\n');
  }, [files, format, excludeExtensions]);

  const fileCount = files.length;
  const downloadExtension = format === 'picr' ? 'csv' : 'txt';
  const fileNameBase = (folder?.name ?? 'folder').replace(/[^\w.-]+/g, '_');
  const downloadFileName = `${fileNameBase}-export.${downloadExtension}`;

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
        {/*<Checkbox*/}
        {/*  checked={includeSubfolders}*/}
        {/*  onChange={(event) =>*/}
        {/*    setIncludeSubfolders(event.currentTarget.checked)*/}
        {/*  }*/}
        {/*  disabled*/}
        {/*  label="Include subfolders"*/}
        {/*  description="Feature coming soon"*/}
        {/*/>*/}

        <Text size="sm" c="dimmed">
          {fileCount} file{fileCount === 1 ? '' : 's'} in export preview
        </Text>

        <Textarea
          value={output}
          readOnly
          minRows={6}
          autosize
          placeholder="No files to export yet."
        />

        <Group justify="flex-end">
          <Button
            variant="default"
            onClick={handleCopy}
            disabled={!output}
            leftSection={<ClipboardIcon />}
          >
            Copy to clipboard
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!output}
            leftSection={<DownloadIcon />}
          >
            Download
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
