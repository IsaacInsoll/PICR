import { MinimalFolder, MinimalSharedFolder } from '../../types';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import { useMemo } from 'react';
import { picrGridProps } from './PicrDataGrid';
import { Page } from './Page';

interface FolderListViewProps {
  folders: MinimalFolder[];
  onClick: (folder: MinimalFolder) => void;
}

export const FolderListView = ({ folders, onClick }: FolderListViewProps) => {
  if (!folders || folders.length === 0) return undefined;
  const tableOptions = useMemo(
    () => picrGridProps(columns, folders, (row) => onClick(row)),
    [],
  );
  const table = useMantineReactTable(tableOptions);
  return (
    <Page>
      <MantineReactTable table={table} />
    </Page>
  );
};

const columns: MRT_ColumnDef<MinimalSharedFolder>[] = [
  { accessorKey: 'name', header: 'Folder Name' },
];
