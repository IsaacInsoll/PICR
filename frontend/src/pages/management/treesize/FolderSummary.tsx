import type { TreeSizeQueryQuery } from '@shared/gql/graphql';
import type { MantineStyleProp } from '@mantine/core';
import { Alert, Box, Code, Progress, Stack, Table, Tabs } from '@mantine/core';
import { formatBytes } from '@shared/prettyBytes';
import { chartColorFiles } from './chartColors';
import type { PieSlice } from './useTreeSize';
import { FileIcon, FolderIcon, InfoIcon } from '../../../PicrIcons';
import { atom, useAtom } from 'jotai';
import { useLanguage } from '../../../i18n/useLanguage';
import { useTranslation } from 'react-i18next';

export const treeSizeTabAtom = atom<'subfolders' | 'files'>('subfolders');

export const FolderSummary = ({
  folder,
  setFolderId,
  setHover,
  hover,
  slices,
}: {
  folder: NonNullable<TreeSizeQueryQuery['folder']>;
  setFolderId: (id: string) => void;
  setHover: (id: string | null) => void;
  hover: string | null;
  slices: PieSlice[];
}) => {
  const [treeSizeTab, setTreeSizeTab] = useAtom(treeSizeTabAtom);
  const { t } = useTranslation('gallery');
  const data: { id: string; name: string; size: number; color?: string }[] =
    folder.subFolders.map((f) => ({
      ...f,
      size: parseInt(f.totalSize, 10),
    }));
  data.push({
    id: 'files',
    name: '(Files)',
    size: parseInt(folder.totalDirectSize, 10),
    color: chartColorFiles,
  });
  const sorted = data.sort((a, b) => b.size - a.size);
  const largest = sorted[0].size;

  return (
    <Box
      style={{
        flexGrow: 1,
        // opacity:
        //   hover && !['rest', 'files'].includes(hover ?? '') ? 0.5 : undefined,
      }}
    >
      <Tabs
        value={treeSizeTab}
        onChange={(value) => {
          if (value === 'subfolders' || value === 'files') {
            setTreeSizeTab(value);
          }
        }}
      >
        <Tabs.List>
          <Tabs.Tab value="subfolders" leftSection={<FolderIcon />}>
            {t('count.folder', { count: folder.subFolders.length })}
          </Tabs.Tab>
          <Tabs.Tab value="files" leftSection={<FileIcon />}>
            {t('count.file', { count: folder.files.length })}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="subfolders">
          <FolderTable
            sorted={sorted}
            largest={largest}
            setHover={setHover}
            setFolderId={setFolderId}
            hover={hover}
            slices={slices}
          />
        </Tabs.Panel>

        <Tabs.Panel value="files">
          <FileTable files={folder.files} />
        </Tabs.Panel>
      </Tabs>
      <Stack gap="xs"></Stack>
    </Box>
  );
};

export const FileTable = ({
  files,
}: {
  files: { id: string; name: string; fileSize: string }[];
}) => {
  const limit = 20;
  const top = files
    .slice()
    .sort((a, b) => parseInt(b.fileSize, 10) - parseInt(a.fileSize, 10))
    .slice(0, limit);
  return (
    <Stack>
      {files.length > limit ? (
        <Alert
          variant="light"
          color="blue"
          title=""
          icon={<InfoIcon />}
          p="xs"
          mt="sm"
        >
          Folder contains {files.length} files, showing largest {limit}
        </Alert>
      ) : null}
      <Table>
        <Table.Tbody>
          {top.map((f) => {
            return (
              <Table.Tr key={f.id}>
                <Table.Td style={{ fontStyle: 'italic' }}>{f.name}</Table.Td>
                <Table.Td align="right">
                  <Bytes bytes={parseInt(f.fileSize, 10)} />
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  );
};

export const FolderTable = ({
  sorted,
  largest,
  setHover,
  setFolderId,
  hover,
  slices,
}: {
  sorted: { id: string; name: string; size: number; color?: string }[];
  largest: number | null;
  setHover: (id: string | null) => void;
  setFolderId: (id: string) => void;
  hover: string | null;
  slices: PieSlice[];
}) => {
  return (
    <Table>
      <Table.Tbody>
        {sorted.map((f) => {
          const isFiles = f.id === 'files';
          const percent = largest ? (f.size / largest) * 100 : 0;
          return (
            <Table.Tr
              key={f.id}
              onClick={() => setFolderId(f.id)}
              onMouseOver={() => setHover(f.id)}
              onMouseOut={() => setHover(null)}
              style={{
                cursor: 'pointer',
                backgroundColor:
                  hover === f.id ||
                  (hover === 'rest' && !slices.some(({ x }) => x === f.id))
                    ? f.color + '33'
                    : undefined,
              }}
            >
              <Table.Td>
                <Progress
                  radius="xs"
                  size="xs"
                  value={percent}
                  style={{ width: 100 }}
                  color={f.color}
                />
              </Table.Td>
              <Table.Td
                c={isFiles ? 'dimmed' : undefined}
                style={isFiles ? { fontStyle: 'italic' } : undefined}
              >
                {f.name}
              </Table.Td>
              <Table.Td align="right">
                <Bytes bytes={f.size} />
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
};

const Bytes = ({ bytes }: { bytes: number }) => {
  const { formattingLocale } = useLanguage();
  const { formatted, unit } = formatBytes(bytes, formattingLocale);
  return <Code style={bytesOpacity[unit]}>{formatted}</Code>;
};

const bytesOpacity: { [key: string]: MantineStyleProp } = {
  B: { opacity: '20%', fontStyle: 'italic' },
  kB: { opacity: '20%' },
  MB: { opacity: '40%', fontWeight: 'light' },
  GB: { opacity: '80%' },
  TB: { opacity: '100%', fontWeight: 'bolder' },
};
