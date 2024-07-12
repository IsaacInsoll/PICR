import { MinimalSharedFolder } from '../../types';
import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from 'mantine-react-table';
import { useMemo } from 'react';
import { picrGridProps } from './PicrDataGrid';
import { Page } from './Page';
import { Folder } from '../../../graphql-types';
import { useSetFolder } from '../useSetFolder';

export const SubfolderListView = ({ folder }: { folder: Folder }) => {
  const setFolder = useSetFolder();

  if (!folder || folder.subFolders.length === 0) return undefined;

  const parents = [folder, ...folder.parents];

  const tableOptions = useMemo(
    () =>
      picrGridProps(columns, folder.subFolders, (row) =>
        setFolder({ ...row, parents }),
      ),
    [folder.subFolders],
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
