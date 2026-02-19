// I've already moved from grommet-datatable to mantine-react-table so lets try to minimise future burden...
import {
  MantineReactTable,
  MRT_ColumnDef,
  MRT_Row,
  MRT_RowData,
  MRT_TableInstance,
  MRT_TableOptions,
  useMantineReactTable,
} from 'mantine-react-table';
import { ReactNode, useMemo } from 'react';

export type PicrColumns<TData extends MRT_RowData> = MRT_ColumnDef<TData>;

export interface MenuItemsProps<TData extends MRT_RowData> {
  renderedRowIndex?: number;
  row: MRT_Row<TData>;
  table: MRT_TableInstance<TData>;
}

function picrGridProps<TData extends MRT_RowData>(
  columns: MRT_ColumnDef<TData>[],
  data: TData[],
  onClick: (row: TData) => void,
  onMouseOver?: (row: TData) => void,
  menuItems?: (props: MenuItemsProps<TData>) => ReactNode,
): MRT_TableOptions<TData> {
  return {
    columns,
    data,
    enableColumnActions: false,
    enableColumnFilters: false,
    enablePagination: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    // enableStickyHeader: true, // requires a maxHeight :/
    initialState: { density: 'xs' },
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        onClick(row.original);
      },
      onMouseOver: () => {
        if (onMouseOver) onMouseOver(row.original);
      },
      style: { cursor: 'pointer' },
    }),
    enableRowActions: !!menuItems,
    renderRowActionMenuItems: menuItems,
    positionActionsColumn: 'last',
    // mantineTableProps: {
    //   sx: {
    //     tableLayout: 'fixed',
    //   },
    // },
  };
}

export const PicrDataGrid = <TData extends MRT_RowData>({
  columns,
  data,
  onClick,
  onMouseover,
  menuItems,
}: {
  columns: MRT_ColumnDef<TData>[];
  data: TData[] | undefined;
  onClick: (row: TData) => void;
  onMouseover?: (row: TData) => void;
  menuItems?: (props: MenuItemsProps<TData>) => ReactNode;
}) => {
  const tableOptions = useMemo(
    () =>
      picrGridProps(
        columns,
        data ?? [],
        (row) => onClick(row),
        (row) => {
          if (onMouseover) onMouseover(row);
        },
        menuItems,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omitting callback refs to avoid re-render storms from unstable references
    [columns, data],
  );
  const table = useMantineReactTable(tableOptions);
  return <MantineReactTable table={table} />;
};
