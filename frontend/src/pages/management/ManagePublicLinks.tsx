import { ReactNode, Suspense, useState } from 'react';
import { useQuery } from 'urql';
import { manageFolderQuery } from '@shared/urql/queries/manageFolderQuery';
import QueryFeedback from '../../components/QueryFeedback';
import { ManagePublicLink } from './ManagePublicLink';
import { PicrFolder } from '../../../types';
import { DisconnectedIcon } from '../../PicrIcons';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';
import { Button, Divider, Group, Stack, Switch } from '@mantine/core';
import { PicrDataGrid } from '../../components/PicrDataGrid';
import { EmptyPlaceholder } from '../EmptyPlaceholder';
import { PublicLinkIcon } from '../../PicrIcons';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { Tips } from '../../components/Tips';
import { publicLinkColumns } from './userColumns';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { ManageFolderQueryQuery } from '@shared/gql/graphql';

interface ManagePublicLinksProps {
  folder: PicrFolder;
  children?: ReactNode;
  disableAddingLinks?: boolean;
  relations: 'none' | 'parents' | 'children' | 'options';
}

export const ManagePublicLinks = ({
  folder,
  children,
  disableAddingLinks,
  relations,
}: ManagePublicLinksProps) => {
  const isMobile = useIsMobile();
  const [includeParents, setIncludeParents] = useState(relations == 'parents');
  const [includeChildren, setIncludeChildren] = useState(
    relations == 'children',
  );

  const [linkId, setLinkId] = useState<string | null>(null);
  return (
    <>
      {linkId !== null ? (
        <Suspense fallback={<ModalLoadingIndicator />}>
          <ManagePublicLink
            onClose={() => {
              setLinkId(null);
            }}
            id={linkId}
            folder={folder}
          />
        </Suspense>
      ) : null}
      {relations == 'options' ? (
        <Stack>
          <Divider />
          <Tips type="PublicLink" />
          <Group justify="flex-end" pb="xs">
            <Switch
              checked={includeParents}
              onChange={(e) => setIncludeParents(e.currentTarget.checked)}
              label={isMobile ? 'Include Parents' : 'Include Parent Folders'}
            />
            <Switch
              checked={includeChildren}
              onChange={(e) => setIncludeChildren(e.currentTarget.checked)}
              label={isMobile ? 'Include Children' : 'Include Child Folders'}
            />
          </Group>
        </Stack>
      ) : null}
      <Suspense fallback={<LoadingIndicator />}>
        <Body
          includeChildren={includeChildren}
          includeParents={includeParents}
          setLinkId={setLinkId}
          folderId={folder.id}
        />
      </Suspense>
      <Group gap="md" pt="md" justify="space-evenly">
        {!disableAddingLinks ? (
          <Button variant="default" onClick={() => setLinkId('')}>
            <PublicLinkIcon />
            Create Link
          </Button>
        ) : null}
        {children}
      </Group>
    </>
  );
};

const Body = ({
  folderId,
  includeParents,
  includeChildren,
  setLinkId,
}: {
  folderId: string;
  includeParents: boolean;
  includeChildren: boolean;
  setLinkId: (id: string | null) => void;
}) => {
  const [result, reQuery] = useQuery({
    query: manageFolderQuery,
    variables: { folderId, includeParents, includeChildren },
  });
  const users = (result.data?.users ?? []).filter(
    (u): u is NonNullable<ManageFolderQueryQuery['users'][number]> => u != null,
  );
  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      <SharedFolderDataGrid
        sharedFolders={users}
        setSharedFolderId={setLinkId}
      />
    </>
  );
};

const SharedFolderDataGrid = ({
  sharedFolders,
  setSharedFolderId,
}: {
  sharedFolders: NonNullable<ManageFolderQueryQuery['users'][number]>[];
  setSharedFolderId: (id: string) => void;
}) => {
  return (
    <>
      {sharedFolders.length === 0 ? (
        <EmptyPlaceholder
          text="You haven't created any links yet!"
          icon={<DisconnectedIcon />}
        />
      ) : (
        <PicrDataGrid
          columns={publicLinkColumns}
          data={sharedFolders}
          onClick={(row) => {
            if (row.id) setSharedFolderId(row.id);
          }}
        />
      )}
    </>
  );
};
