import {
  createPicrColumns,
  type PicrColumns,
} from '../../components/PicrDataGrid';
import type { PicrUser } from '@shared/types/picr';
import { FolderName } from '../../components/FolderName';
import { CopyPublicLinkButton } from './CopyPublicLinkButton';
import { CommentChip } from '../../components/CommentChip';
import { Group } from '@mantine/core';
import { ViewFolderButton } from '../../components/ViewFolderButton';
import { BooleanIcon } from './BooleanIcon';
import { LinkModeChip } from '../../components/LinkModeChip';
import { CommentPermissions, LinkMode } from '@shared/gql/graphql';

const userColumn = createPicrColumns<PicrUser>();

export const userColumns: PicrColumns<PicrUser>[] = [
  userColumn.accessor('name', { header: 'Name', minWidth: 25 }),
  userColumn.accessor('username', {
    header: 'Username',
    minWidth: 25,
  }),
  userColumn.accessor('folder.name', {
    header: 'Folder',
    minWidth: 25,
    cell: ({ row }) =>
      row.original.folder ? <FolderName folder={row.original.folder} /> : null,
  }),
  userColumn.accessor('enabled', {
    maxWidth: 50,
    header: 'Enabled',
    cell: ({ value }) => <BooleanIcon value={!!value} />,
  }),
];

export const publicLinkColumns: PicrColumns<PicrUser>[] = [
  userColumn.accessor('name', { header: 'Name', minWidth: 25 }),
  userColumn.accessor('folder.name', {
    header: 'Folder',
    minWidth: 25,
    cell: ({ row }) =>
      row.original.folder ? <FolderName folder={row.original.folder} /> : null,
  }),
  userColumn.accessor('enabled', {
    maxWidth: 50,
    header: 'Enabled',
    cell: ({ value }) => <BooleanIcon value={!!value} />,
  }),
  userColumn.accessor('commentPermissions', {
    header: 'Comments',
    maxWidth: 75,
    cell: ({ value }) => (
      <CommentChip commentPermissions={value ?? CommentPermissions.Read} />
    ),
  }),
  userColumn.accessor('linkMode', {
    header: 'LinkMode',
    maxWidth: 75,
    cell: ({ value }) => (
      <LinkModeChip linkMode={value ?? LinkMode.FinalDelivery} />
    ),
  }),
  userColumn.display({
    id: 'actions',
    header: 'Actions',
    minWidth: 200,
    cell: ({ row }) => (
      <Group gap={1}>
        <CopyPublicLinkButton
          disabled={
            !row.original.enabled ||
            !row.original.uuid ||
            !row.original.folderId
          }
          hash={row.original.uuid ?? undefined}
          folderId={row.original.folderId ?? undefined}
          variant="subtle"
          size="compact-sm"
        />
        {row.original.folder ? (
          <ViewFolderButton
            folder={row.original.folder}
            variant="subtle"
            size="compact-sm"
          />
        ) : null}
      </Group>
    ),
  }),
];
