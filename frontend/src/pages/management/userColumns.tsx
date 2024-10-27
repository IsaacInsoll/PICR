import { PicrColumns } from '../../components/PicrDataGrid';
import { User } from '../../../../graphql-types';
import { TbCircleCheck, TbCircleXFilled } from 'react-icons/tb';
import { folder } from '../../../../backend/graphql/queries/folder';
import { Code } from '@mantine/core';
import { FolderName } from '../../components/FolderName';

export const userColumns: PicrColumns<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'username', header: 'Username' },
  {
    accessorKey: 'folder.name',
    header: 'Folder',
    accessorFn: ({ folder }) => <FolderName folder={folder} />,
  },
  {
    accessorKey: 'enabled',
    header: 'Enabled',
    accessorFn: ({ enabled }) =>
      enabled ? (
        <TbCircleCheck style={{ color: 'green' }} />
      ) : (
        <TbCircleXFilled style={{ color: 'red' }} />
      ),
  },
];

export const publicLinkColumns = userColumns.filter(
  ({ accessorKey }: PicrColumns<User>) => {
    return !['username'].includes(accessorKey);
  },
);
