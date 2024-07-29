// I've already moved from grommet-datatable to mantine-react-table so lets try to minimise future burden...
import {
  MantineReactTable,
  MRT_ColumnDef,
  MRT_RowData,
  MRT_TableOptions,
  useMantineReactTable,
} from 'mantine-react-table';
import { useMemo } from 'react';

export type PicrColumns<TData extends MRT_RowData> = MRT_ColumnDef<TData>;

function picrGridProps<TData extends MRT_RowData>(
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
    initialState: { density: 'xs' },
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        onClick(row.original);
      },
      style: { cursor: 'pointer' },
    }),
  };
}

export const PicrDataGrid = <TData extends MRT_RowData>({
  columns,
  data,
  onClick,
}: {
  columns: MRT_ColumnDef<TData>[];
  data: TData[] | undefined;
  onClick: (row: TData) => void;
}) => {
  const tableOptions = useMemo(
    () => picrGridProps(columns, data, (row) => onClick(row)),
    [data],
  );
  const table = useMantineReactTable(tableOptions);
  return <MantineReactTable table={table} />;
};
