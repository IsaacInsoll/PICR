import type { PicrColumns } from '../../components/PicrDataGrid';
import { PrimaryColor, ThemeMode } from '@shared/gql/graphql';
import type { DefaultMantineColor } from '@mantine/core';
import { Badge, Text } from '@mantine/core';
import type { BrandingRow } from '@shared/types/queryRows';

export const brandingColumns: PicrColumns<BrandingRow>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    minSize: 30,
    accessorFn: ({ name }) => <Text fw={500}>{name}</Text>,
  },
  {
    accessorKey: 'folders',
    header: 'Folders',
    minSize: 20,
    accessorFn: ({ folders }) => (
      <Text size="sm" c="dimmed">
        {folders?.length ?? 0} folder{folders?.length === 1 ? '' : 's'}
      </Text>
    ),
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    minSize: 20,
    accessorFn: ({ mode }) => <ModeChip mode={mode ?? ThemeMode.Auto} />,
  },
  {
    accessorKey: 'primaryColor',
    header: 'Color',
    minSize: 20,
    accessorFn: ({ primaryColor }) => (
      <PrimaryColorChip color={primaryColor ?? PrimaryColor.Blue} />
    ),
  },
];

const PrimaryColorChip = ({ color }: { color: DefaultMantineColor }) => {
  return <Badge color={color}>{color}</Badge>;
};

const ModeChip = ({ mode }: { mode: ThemeMode }) => {
  return (
    <Badge
      color={modeMap[mode]}
      variant={mode == 'auto' ? 'default' : undefined}
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
