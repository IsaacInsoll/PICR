import { PicrColumns } from '../../components/PicrDataGrid';
import { Branding, ThemeMode } from '../../../../graphql-types';
import { FolderName } from '../../components/FolderName';
import {
  Badge,
  DefaultMantineColor,
  MantineColorSchemeManager,
} from '@mantine/core';

export const brandingColumns: PicrColumns<Branding>[] = [
  {
    accessorKey: 'folder.name',
    header: 'Folder',
    minSize: 25,
    accessorFn: ({ folder }) => <FolderName folder={folder} />,
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    minSize: 25,
    accessorFn: ({ mode }) => <ModeChip mode={mode} />,
  },
  {
    accessorKey: 'primaryColor',
    header: 'Primary Color',
    minSize: 25,
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
