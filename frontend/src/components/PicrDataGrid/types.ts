import {
  createColumnHelper,
  type AccessorFn,
  type CellContext,
  type ColumnDef,
  type DeepKeys,
  type DeepValue,
  type DisplayColumnDef,
  type IdentifiedColumnDef,
  type RowData,
} from '@tanstack/react-table';
import type { CSSProperties, ReactNode } from 'react';

export type PicrRow<TData> = {
  index: number;
  original: TData;
};

export type PicrCellContext<TData, TValue = unknown> = {
  row: PicrRow<TData>;
  value: TValue;
};

export type PicrDisplayCellContext<TData> = {
  row: PicrRow<TData>;
};

// React intentionally treats callback props bivariantly; this keeps column cell
// renderers ergonomic when their value type is narrower than the column union.
type CellRenderer<TData, TValue> = {
  bivarianceHack(props: PicrCellContext<TData, TValue>): ReactNode;
}['bivarianceHack'];

type DisplayCellRenderer<TData> = {
  bivarianceHack(props: PicrDisplayCellContext<TData>): ReactNode;
}['bivarianceHack'];

type PicrColumnSizing = {
  maxWidth?: number | string;
  minWidth?: number | string;
  width?: number | string;
  widthPercent?: number;
};

type PicrAccessorColumnOptions<TData extends RowData, TValue> = Omit<
  IdentifiedColumnDef<TData, TValue>,
  'cell' | 'meta'
> &
  PicrColumnSizing & {
    cell?: CellRenderer<TData, TValue>;
    meta?: PicrColumnMeta;
  };

type PicrAccessorFnColumnOptions<TData extends RowData, TValue> = Omit<
  DisplayColumnDef<TData, TValue>,
  'cell' | 'meta'
> &
  PicrColumnSizing & {
    cell?: CellRenderer<TData, TValue>;
    meta?: PicrColumnMeta;
  };

type PicrDisplayColumnOptions<TData extends RowData> = Omit<
  DisplayColumnDef<TData>,
  'cell' | 'meta'
> &
  PicrColumnSizing & {
    cell: DisplayCellRenderer<TData>;
    id: string;
    meta?: PicrColumnMeta;
  };

export type PicrColumns<TData extends RowData> = ColumnDef<TData, unknown>;

export interface MenuItemsProps<TData> {
  row: PicrRow<TData>;
}

export type PicrColumnMeta = {
  style?: CSSProperties;
};

const columnStyle = (column: PicrColumnSizing): CSSProperties => {
  const width =
    column.widthPercent == null ? column.width : `${column.widthPercent}%`;

  return {
    maxWidth: column.maxWidth,
    minWidth: column.minWidth,
    width,
  };
};

const withColumnMeta = <
  TColumn extends PicrColumnSizing & { meta?: PicrColumnMeta },
>(
  column: TColumn,
) => {
  const { maxWidth, minWidth, width, widthPercent, meta, ...columnDef } =
    column;

  return {
    ...columnDef,
    meta: {
      ...meta,
      style: {
        ...meta?.style,
        ...columnStyle({ maxWidth, minWidth, width, widthPercent }),
      },
    },
  };
};

const picrRow = <TData extends RowData, TValue>(
  cellContext: CellContext<TData, TValue>,
) => ({
  index: cellContext.row.index,
  original: cellContext.row.original,
});

const accessorCell =
  <TData extends RowData, TValue>(cell?: CellRenderer<TData, TValue>) =>
  (cellContext: CellContext<TData, TValue>) => {
    const value = cellContext.getValue();
    return cell
      ? cell({
          row: picrRow(cellContext),
          value,
        })
      : String(value ?? '');
  };

const displayCell =
  <TData extends RowData>(cell: DisplayCellRenderer<TData>) =>
  (cellContext: CellContext<TData, unknown>) =>
    cell({ row: picrRow(cellContext) });

export const createPicrColumns = <TData extends RowData>() => {
  const columnHelper = createColumnHelper<TData>();

  return {
    accessor: <
      TAccessor extends AccessorFn<TData> | DeepKeys<TData>,
      TValue extends TAccessor extends AccessorFn<TData, infer TReturn>
        ? TReturn
        : TAccessor extends DeepKeys<TData>
          ? DeepValue<TData, TAccessor>
          : never,
    >(
      accessor: TAccessor,
      column: TAccessor extends AccessorFn<TData>
        ? PicrAccessorFnColumnOptions<TData, TValue>
        : PicrAccessorColumnOptions<TData, TValue>,
    ): PicrColumns<TData> => {
      const { cell, ...columnOptions } = column;
      const columnDef = {
        ...withColumnMeta(columnOptions),
        cell: accessorCell(cell),
      } as TAccessor extends AccessorFn<TData>
        ? DisplayColumnDef<TData, TValue>
        : IdentifiedColumnDef<TData, TValue>;

      return columnHelper.accessor(accessor, columnDef) as PicrColumns<TData>;
    },
    display: (column: PicrDisplayColumnOptions<TData>): PicrColumns<TData> => {
      const { cell, ...columnOptions } = column;

      return columnHelper.display({
        ...withColumnMeta(columnOptions),
        cell: displayCell(cell),
      }) as PicrColumns<TData>;
    },
  };
};

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TanStack requires both generic parameters in declaration merging
  interface ColumnMeta<TData, TValue> {
    style?: PicrColumnMeta['style'];
  }
}
