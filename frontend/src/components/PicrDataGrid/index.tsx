import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import {
  ActionIcon,
  Group,
  Menu,
  ScrollArea,
  Table,
  Text,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, DotsIcon } from '../../PicrIcons';
import type { MenuItemsProps, PicrColumns } from './types';

export { createPicrColumns } from './types';
export type {
  MenuItemsProps,
  PicrCellContext,
  PicrColumns,
  PicrDisplayCellContext,
  PicrRow,
} from './types';

export const PicrDataGrid = <TData,>({
  columns,
  data,
  onClick,
  onMouseover,
  menuItems,
}: {
  columns: PicrColumns<TData>[];
  data: TData[] | undefined;
  onClick?: (row: TData) => void;
  onMouseover?: (row: TData) => void;
  menuItems?: (props: MenuItemsProps<TData>) => ReactNode;
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableData = data ?? [];
  // TanStack Table intentionally returns function-heavy instances; React Compiler
  // skips this component but the table state remains owned by TanStack.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <ScrollArea>
      <Table highlightOnHover verticalSpacing={4}>
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortDirection = header.column.getIsSorted();
                const style = header.column.columnDef.meta?.style;
                const canSort = header.column.getCanSort();

                return (
                  <Table.Th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{
                      ...style,
                      cursor: canSort ? 'pointer' : undefined,
                      userSelect: canSort ? 'none' : undefined,
                    }}
                  >
                    <Group gap={4} wrap="nowrap">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {sortDirection === 'asc' ? (
                        <ChevronUpIcon size={14} />
                      ) : null}
                      {sortDirection === 'desc' ? (
                        <ChevronDownIcon size={14} />
                      ) : null}
                    </Group>
                  </Table.Th>
                );
              })}
              {menuItems ? <Table.Th w={48} /> : null}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => (
            <Table.Tr
              key={row.id}
              onClick={onClick ? () => onClick(row.original) : undefined}
              onMouseOver={() => onMouseover?.(row.original)}
              style={{ cursor: onClick ? 'pointer' : undefined }}
            >
              {row.getVisibleCells().map((cell) => {
                const style = cell.column.columnDef.meta?.style;

                return (
                  <Table.Td key={cell.id} style={style}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Td>
                );
              })}
              {menuItems ? (
                <Table.Td
                  onClick={(event) => event.stopPropagation()}
                  style={{ width: 48 }}
                >
                  <Menu position="bottom-end" withinPortal>
                    <Menu.Target>
                      <ActionIcon
                        aria-label="Row actions"
                        size="sm"
                        variant="subtle"
                      >
                        <DotsIcon size={18} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {menuItems({
                        row: { index: row.index, original: row.original },
                      })}
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              ) : null}
            </Table.Tr>
          ))}
          {table.getRowModel().rows.length === 0 ? (
            <Table.Tr>
              <Table.Td
                colSpan={columns.length + (menuItems ? 1 : 0)}
                ta="center"
              >
                <Text c="dimmed" size="sm">
                  No records
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : null}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
};
