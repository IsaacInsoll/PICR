import { PicrColumns } from '../../components/PicrDataGrid';
import { User } from '../../../../graphql-types';
import { TbCircleCheck, TbCircleXFilled } from 'react-icons/tb';
import { folder } from '../../../../backend/graphql/queries/folder';
import { Code } from '@mantine/core';
import { FolderName } from '../../components/FolderName';
import { CopyPublicLinkButton } from './CopyPublicLinkButton';
import { CommentChip } from '../../components/CommentChip';

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

export const publicLinkColumns: PicrColumns<User>[] = [
  ...userColumns.filter(({ accessorKey }: PicrColumns<User>) => {
    return !['username'].includes(accessorKey);
  }),
  {
    header: 'Comments',
    accessorFn: (user: User) => (
      <CommentChip commentPermissions={user.commentPermissions} />
    ),
  },
  {
    header: 'Copy Link',
    accessorFn: ({ enabled, uuid, folderId }) => (
      <CopyPublicLinkButton
        disabled={!enabled}
        hash={uuid}
        folderId={folderId}
        variant="subtle"
        size="compact-sm"
      />
    ),
  },
];
