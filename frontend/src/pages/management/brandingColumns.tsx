import { PicrColumns } from '../../components/PicrDataGrid';
import { Branding, ThemeMode } from '../../../../graphql-types';
import { Badge, DefaultMantineColor, Text } from '@mantine/core';

export const brandingColumns: PicrColumns<Branding>[] = [
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
    accessorFn: ({ mode }) => <ModeChip mode={mode} />,
  },
  {
    accessorKey: 'primaryColor',
    header: 'Color',
    minSize: 20,
    accessorFn: ({ primaryColor }) => <PrimaryColorChip color={primaryColor} />,
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
