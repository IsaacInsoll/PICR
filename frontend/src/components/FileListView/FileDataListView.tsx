import { useMemo } from 'react';
import { MinimalFile } from '../../../types';
import { FileListViewStyleComponentProps } from './FolderContentsView';
import prettyBytes from 'pretty-bytes';
import { picrGridProps } from '../PicrDataGrid';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import { Page } from '../Page';

export const FileDataListView = ({
  files,
  setSelectedFileId,
}: FileListViewStyleComponentProps) => {
  const tableOptions = useMemo(
    () => picrGridProps(columns, files, (row) => setSelectedFileId(row.id)),
    [files], //files changes whenever you change a filtering option
  );
  const table = useMantineReactTable(tableOptions);

  return (
    <Page>
      <MantineReactTable table={table} />
    </Page>
  );
};

const columns: MRT_ColumnDef<MinimalFile>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'fileSize',
    header: 'File Size',
    accessorFn: ({ fileSize }) => (fileSize ? prettyBytes(fileSize) : null),
  },
];
