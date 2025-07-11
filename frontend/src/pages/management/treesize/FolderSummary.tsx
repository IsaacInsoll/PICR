import { Folder } from '../../../../../graphql-types';
import {
  Alert,
  Box,
  Code,
  MantineStyleProp,
  Progress,
  Stack,
  Table,
  Tabs,
} from '@mantine/core';
import { prettyBytes } from '@shared/prettyBytes';
import { chartColorFiles } from './chartColors';
import { PieSlice } from './useTreeSize';
import { FileIcon, FolderIcon, InfoIcon } from '../../../PicrIcons';
import { atom, useAtom } from 'jotai';
import { pluralize } from '@shared/pluralize';

export const treeSizeTabAtom = atom<'subfolders' | 'files'>('subfolders');

export const FolderSummary = ({
  folder,
  setFolderId,
  setHover,
  hover,
  slices,
}: {
  folder: Folder;
  setFolderId: (id: string) => void;
  setHover: (id: string) => void;
  hover: string | null;
  slices: PieSlice[];
}) => {
  const [treeSizeTab, setTreeSizeTab] = useAtom(treeSizeTabAtom);
  if (!folder) return null;
  const data = folder.subFolders.map((f) => ({
    ...f,
    size: parseInt(f.totalSize),
  }));
  data.push({
    id: 'files',
    name: '(Files)',
    size: parseInt(folder.totalDirectSize),
    color: chartColorFiles,
  });
  const sorted = data.sort((a, b) => b.size - a.size);
  const largest = sorted[0].size ?? null;

  return (
    <Box
      style={{
        flexGrow: 1,
        // opacity:
        //   hover && !['rest', 'files'].includes(hover ?? '') ? 0.5 : undefined,
      }}
    >
      <Tabs value={treeSizeTab} onChange={setTreeSizeTab}>
        <Tabs.List>
          <Tabs.Tab value="subfolders" leftSection={<FolderIcon />}>
            {pluralize(folder?.subFolders.length, 'folder', true)}
          </Tabs.Tab>
          <Tabs.Tab value="files" leftSection={<FileIcon />}>
            {pluralize(folder?.files?.length, 'file', true)}
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
          <FileTable files={folder?.files} />
        </Tabs.Panel>
      </Tabs>
      <Stack gap="xs"></Stack>
    </Box>
  );
};

export const FileTable = ({ files }) => {
  const limit = 20;
  const top = files.sort((a, b) => b.fileSize - a.fileSize).slice(0, limit);
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
                  <Bytes bytes={f.fileSize} />
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
}) => {
  return (
    <Table>
      <Table.Tbody>
        {sorted.map((f) => {
          const isFiles = f.id == 'files';
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
                  hover == f.id ||
                  (hover == 'rest' && !slices.some(({ x }) => x == f.id))
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
  const b = prettyBytes(bytes);
  const unit = b.split(' ')[1];
  return <Code style={bytesOpacity[unit]}>{prettyBytes(bytes)}</Code>;
};

const bytesOpacity: { [key: string]: MantineStyleProp } = {
  B: { opacity: '20%', fontStyle: 'italic' },
  KB: { opacity: '20%' },
  MB: { opacity: '40%', fontWeight: 'light' },
  GB: { opacity: '80%' },
  TB: { opacity: '100%', fontWeight: 'bolder' },
};
