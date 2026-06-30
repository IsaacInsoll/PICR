import {
  createPicrColumns,
  type PicrColumns,
} from '../../components/PicrDataGrid';
import { PrimaryColor, ThemeMode } from '@shared/gql/graphql';
import type { DefaultMantineColor } from '@mantine/core';
import { Badge, Text } from '@mantine/core';
import type { BrandingRow } from '@shared/types/queryRows';
import { BrandingFolderChips } from '../../components/BrandingFolderChips';

const brandingColumn = createPicrColumns<BrandingRow>();

export const brandingColumns: PicrColumns<BrandingRow>[] = [
  brandingColumn.accessor('name', {
    header: 'Name',
    minWidth: 30,
    cell: ({ value }) => <Text fw={500}>{String(value ?? '')}</Text>,
  }),
  brandingColumn.display({
    id: 'folders',
    header: 'Folders',
    minWidth: 40,
    cell: ({ row }) => (
      <BrandingFolderChips folders={row.original.folders} showLabel={false} />
    ),
  }),
  brandingColumn.accessor('mode', {
    header: 'Mode',
    minWidth: 20,
    cell: ({ value }) => <ModeChip mode={value ?? ThemeMode.Auto} />,
  }),
  brandingColumn.accessor('primaryColor', {
    header: 'Color',
    minWidth: 20,
    cell: ({ value }) => (
      <PrimaryColorChip color={value ?? PrimaryColor.Blue} />
    ),
  }),
];

const PrimaryColorChip = ({ color }: { color: DefaultMantineColor }) => {
  return <Badge color={color}>{color}</Badge>;
};

const ModeChip = ({ mode }: { mode: ThemeMode }) => {
  return (
    <Badge
      color={modeMap[mode]}
      variant={mode === 'auto' ? 'default' : undefined}
    >
      {mode}
    </Badge>
  );
};

const modeMap = {
  auto: undefined,
  dark: 'dark',
  light: 'gray',
};
