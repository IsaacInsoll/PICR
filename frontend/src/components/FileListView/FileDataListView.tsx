import { useMemo } from 'react';
import { MinimalFile } from '../../../types';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import prettyBytes from 'pretty-bytes';
import { Box } from '@mantine/core';
import { picrGridProps } from '../PicrDataGrid';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';

export const FileDataListView = ({
  files,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  const tableOptions = useMemo(
    () => picrGridProps(columns, files, (row) => setSelectedFileId(row.id)),
    [],
  );
  const table = useMantineReactTable(tableOptions);

  return (
    <Box p="lg" ta="center">
      <MantineReactTable table={table} />
    </Box>
  );
};
// const dataTableColumnConfig: ColumnConfig<MinimalFile>[] = [
//   { property: 'name', header: <Text>Name</Text> },
//   { property: 'type', header: <Text>Type</Text> },
//   {
//     property: 'fileSize',
//     header: <Text>File Size</Text>,
//     render: ({ fileSize }) => (fileSize ? prettyBytes(fileSize) : null),
//   },
// ];
const columns: MRT_ColumnDef<MinimalFile>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'fileSize',
    header: 'File Size',
    accessorFn: ({ fileSize }) => (fileSize ? prettyBytes(fileSize) : null),
  },
];
