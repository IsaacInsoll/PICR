import { Suspense, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { manageFolderQuery } from '../../urql/queries/manageFolderQuery';
import QueryFeedback from '../../components/QueryFeedback';
import { ManagePublicLink } from './ManagePublicLink';
import { MinimalSharedFolder } from '../../../types';
import { VscDebugDisconnect } from 'react-icons/vsc';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';
import { TbLink, TbPhotoCheck } from 'react-icons/tb';
import { Box, Button, Group } from '@mantine/core';
import { Page } from '../../components/Page';
import { PicrColumns, PicrDataGrid } from '../../components/PicrDataGrid';
import { EmptyPlaceholder } from '../EmptyPlaceholder';
import { generateThumbnailsQuery } from '../../urql/mutations/generateThumbnailsQuery';

export const ManageFolder = ({
  folderId,
  onClose,
}: {
  folderId: string;
  onClose: () => void;
}) => {
  return (
    <Page>
      <Suspense fallback={<ModalLoadingIndicator />}>
        <ManageFolderBody folderId={folderId} onClose={onClose} />
      </Suspense>
    </Page>
  );
};

const ManageFolderBody = ({
  folderId,
  onClose,
}: {
  folderId: string;
  onClose: () => void;
}) => {
  const [result, reQuery] = useQuery({
    query: manageFolderQuery,
    variables: { folderId },
    // context: headers,
  });

  const [, thumbsMutation] = useMutation(generateThumbnailsQuery);

  const [linkId, setLinkId] = useState<string | null>(null);
  const { data } = result;
  const totalImages = data?.folder.totalImages;
  return (
    <Box>
      {linkId !== null ? (
        <Suspense fallback={<ModalLoadingIndicator />}>
          <ManagePublicLink
            onClose={() => {
              setLinkId(null);
              reQuery({ requestPolicy: 'network-only' });
            }}
            id={linkId}
            folder={data?.folder}
          />
        </Suspense>
      ) : null}
      {data?.users ? (
        <SharedFolderDataGrid
          sharedFolders={data?.users}
          setSharedFolderId={setLinkId}
        />
      ) : null}
      <Group gap="md" pt="md" justify="space-evenly">
        <Button variant="default" onClick={() => setLinkId('')}>
          <TbLink />
          Create Link
        </Button>
        <Button
          variant="default"
          disabled={!totalImages || totalImages === 0}
          onClick={() => thumbsMutation({ folderId })}
        >
          <TbPhotoCheck />
          {`Generate ${totalImages} Thumbnails`}
        </Button>
        <Button onClick={onClose}>Close Settings</Button>
      </Group>
      <QueryFeedback result={result} reQuery={reQuery} />
    </Box>
  );
};

const SharedFolderDataGrid = ({
  sharedFolders,
  setSharedFolderId,
}: {
  sharedFolders: MinimalSharedFolder[];
  setSharedFolderId: (id: string) => void;
}) => {
  return (
    <>
      {sharedFolders.length === 0 ? (
        <EmptyPlaceholder
          text="You haven't created any links for this folder (or parent folders) yet!"
          icon={<VscDebugDisconnect />}
        />
      ) : (
        <PicrDataGrid
          columns={columns}
          data={sharedFolders}
          onClick={(row) => setSharedFolderId(row.id)}
        />
      )}
    </>
  );
};

const columns: PicrColumns<MinimalSharedFolder>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'folder.name', header: 'Shared Folder' },
];
