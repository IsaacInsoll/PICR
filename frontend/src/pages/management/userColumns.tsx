import { PicrColumns } from '../../components/PicrDataGrid';
import { PicrUser } from '../../../types';
import { FolderName } from '../../components/FolderName';
import { CopyPublicLinkButton } from './CopyPublicLinkButton';
import { CommentChip } from '../../components/CommentChip';
import { Group } from '@mantine/core';
import { ViewFolderButton } from '../../components/ViewFolderButton';
import { BooleanIcon } from './BooleanIcon';
import { LinkModeChip } from '../../components/LinkModeChip';
import { CommentPermissions, LinkMode } from '../../../../graphql-types';

export const userColumns: PicrColumns<PicrUser>[] = [
  { accessorKey: 'name', header: 'Name', minSize: 25 },
  { accessorKey: 'username', header: 'Username', minSize: 25 },
  {
    accessorKey: 'folder.name',
    header: 'Folder',
    minSize: 25,
    accessorFn: ({ folder }) =>
      folder ? <FolderName folder={folder} /> : undefined,
  },
  {
    accessorKey: 'enabled',
    maxSize: 50,
    header: 'Enabled',
    accessorFn: ({ enabled }) => <BooleanIcon value={!!enabled} />,
  },
];

export const publicLinkColumns: PicrColumns<PicrUser>[] = [
  { accessorKey: 'name', header: 'Name', minSize: 25 },
  {
    accessorKey: 'folder.name',
    header: 'Folder',
    minSize: 25,
    accessorFn: ({ folder }) =>
      folder ? <FolderName folder={folder} /> : undefined,
  },
  {
    accessorKey: 'enabled',
    maxSize: 50,
    header: 'Enabled',
    accessorFn: ({ enabled }) => <BooleanIcon value={!!enabled} />,
  },
  {
    header: 'Comments',
    maxSize: 75,
    accessorFn: (user: PicrUser) => (
      <CommentChip
        commentPermissions={user.commentPermissions ?? CommentPermissions.Read}
      />
    ),
  },
  {
    header: 'LinkMode',
    maxSize: 75,
    accessorFn: (user: PicrUser) => (
      <LinkModeChip linkMode={user.linkMode ?? LinkMode.FinalDelivery} />
    ),
  },
  {
    header: 'Actions',
    minSize: 200,
    accessorFn: ({ enabled, uuid, folderId, folder }) => (
      <Group gap={1}>
        <CopyPublicLinkButton
          disabled={!enabled || !uuid || !folderId}
          hash={uuid ?? ''}
          folderId={folderId ?? ''}
          variant="subtle"
          size="compact-sm"
        />
        {folder ? (
          <ViewFolderButton
            folder={folder}
            variant="subtle"
            size="compact-sm"
          />
        ) : null}
      </Group>
    ),
  },
];
