// I've already moved from grommet-datatable to mantine-react-table so lets try to minimise future burden...
import {
  MRT_ColumnDef,
  MRT_RowData,
  MRT_TableOptions,
} from 'mantine-react-table';

//declare const useMantineReactTable: <TData extends MRT_RowData>(tableOptions: MRT_TableOptions<TData>) => MRT_TableInstance<TData>;
export function picrGridProps<TData extends MRT_RowData>(
  columns: MRT_ColumnDef<TData>[],
  data: TData[],
  onClick: (row: TData) => void,
): MRT_TableOptions<TData> {
  return {
    columns,
    data,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        onClick(row.original);
      },
      style: { cursor: 'pointer' },
    }),
  };
}
