import { PicrColumns } from '../../components/PicrDataGrid';
import { User } from '../../../../graphql-types';
import { TbCircleCheck, TbCircleXFilled } from 'react-icons/tb';
import { FolderName } from '../../components/FolderName';
import { CopyPublicLinkButton } from './CopyPublicLinkButton';
import { CommentChip } from '../../components/CommentChip';
import { Group } from '@mantine/core';
import { ViewFolderButton } from '../../components/ViewFolderButton';

export const userColumns: PicrColumns<User>[] = [
  { accessorKey: 'name', header: 'Name', minSize: 25 },
  { accessorKey: 'username', header: 'Username', minSize: 25 },
  {
    accessorKey: 'folder.name',
    header: 'Folder',
    minSize: 25,
    accessorFn: ({ folder }) => <FolderName folder={folder} />,
  },
  {
    accessorKey: 'enabled',
    maxSize: 50,
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
    maxSize: 75,
    accessorFn: (user: User) => (
      <CommentChip commentPermissions={user.commentPermissions} />
    ),
  },
  {
    header: 'Actions',
    minSize: 200,
    accessorFn: ({ enabled, uuid, folderId, folder }) => (
      <Group gap={1}>
        <CopyPublicLinkButton
          disabled={!enabled}
          hash={uuid}
          folderId={folderId}
          variant="subtle"
          size="compact-sm"
        />
        <ViewFolderButton folder={folder} variant="subtle" size="compact-sm" />
      </Group>
    ),
  },
];
