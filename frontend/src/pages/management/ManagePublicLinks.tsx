import type { ReactNode } from 'react';
import { Suspense, useState } from 'react';
import { useQuery } from 'urql';
import { manageFolderQuery } from '@shared/urql/queries/manageFolderQuery';
import QueryFeedback from '../../components/QueryFeedback';
import { ManagePublicLink } from './ManagePublicLink';
import type { PicrFolder } from '@shared/types/picr';
import { DisconnectedIcon, PublicLinkIcon } from '../../PicrIcons';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';
import { Button, Divider, Group, Stack, Switch } from '@mantine/core';
import { PicrDataGrid } from '../../components/PicrDataGrid';
import { EmptyPlaceholder } from '../EmptyPlaceholder';

import { LoadingIndicator } from '../../components/LoadingIndicator';
import { Tips } from '../../components/Tips';
import { publicLinkColumns } from './userColumns';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { ManageFolderUserRow } from '@shared/types/queryRows';
import { PublicLinkListItem } from '../../components/PublicLinkListItem';

interface ManagePublicLinksProps {
  folder: PicrFolder;
  children?: ReactNode;
  disableAddingLinks?: boolean;
  relations: 'none' | 'parents' | 'children' | 'options';
  variant?: 'table' | 'list';
}

export const ManagePublicLinks = ({
  folder,
  children,
  disableAddingLinks,
  relations,
  variant = 'table',
}: ManagePublicLinksProps) => {
  const isMobile = useIsMobile();
  const [includeParents, setIncludeParents] = useState(relations === 'parents');
  const [includeChildren, setIncludeChildren] = useState(
    relations === 'children',
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
      {relations === 'options' ? (
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
          variant={variant}
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
  variant,
}: {
  folderId: string;
  includeParents: boolean;
  includeChildren: boolean;
  setLinkId: (id: string | null) => void;
  variant: 'table' | 'list';
}) => {
  const [result, reQuery] = useQuery({
    query: manageFolderQuery,
    variables: { folderId, includeParents, includeChildren },
  });
  const users = result.data?.users ?? [];
  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      <PublicLinksView links={users} onSelect={setLinkId} variant={variant} />
    </>
  );
};

const PublicLinksView = ({
  links,
  onSelect,
  variant,
}: {
  links: ManageFolderUserRow[];
  onSelect: (id: string) => void;
  variant: 'table' | 'list';
}) => {
  if (links.length === 0) {
    return (
      <EmptyPlaceholder
        text="You haven't created any links yet!"
        icon={<DisconnectedIcon />}
      />
    );
  }
  if (variant === 'list') {
    return (
      <Stack gap="xs">
        {links.map((link) => (
          <PublicLinkListItem
            key={link.id}
            user={link}
            onClick={() => {
              if (link.id) onSelect(link.id);
            }}
          />
        ))}
      </Stack>
    );
  }
  return (
    <PicrDataGrid
      columns={publicLinkColumns}
      data={links}
      onClick={(row) => {
        if (row.id) onSelect(row.id);
      }}
    />
  );
};
