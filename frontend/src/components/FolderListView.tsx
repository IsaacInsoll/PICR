import { MinimalFolder } from '../../types';
import { DataTable, DataTableColumn } from 'mantine-datatable';

interface FolderListViewProps {
  folders: MinimalFolder[];
  onClick: (folder: MinimalFolder) => void;
}

export const FolderListView = ({ folders, onClick }: FolderListViewProps) => {
  if (!folders || folders.length === 0) return undefined;
  const cols: DataTableColumn[] = [{ accessor: 'name' }];
  return (
    <DataTable
      columns={cols}
      records={folders}
      onRowClick={({ record, index, event }) => {
        onClick(record);
      }}
    />
  );
};
