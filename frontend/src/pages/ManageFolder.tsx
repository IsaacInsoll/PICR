import { ReactNode, Suspense, useState } from 'react';
import { ColumnConfig, DataTable, SortType } from 'grommet';
import { useMutation, useQuery } from 'urql';
import { manageFolderQuery } from '../urql/queries/manageFolderQuery';
import QueryFeedback from '../components/QueryFeedback';
import { ManagePublicLink } from './ManagePublicLink';
import { MinimalSharedFolder } from '../../types';
import { VscDebugDisconnect } from 'react-icons/vsc';
import { gql } from '../helpers/gql';
import { ModalLoadingIndicator } from '../components/ModalLoadingIndicator';
import { TbLink, TbPhotoCheck } from 'react-icons/tb';
import { Box, Button, Container, Group, Text } from '@mantine/core';
import { Page } from '../components/Page';

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
    <Container>
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
      <Group gap="small">
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
        <Button onClick={onClose}>Close Settings </Button>
      </Group>
      <QueryFeedback result={result} reQuery={reQuery} />
    </Container>
  );
};

const SharedFolderDataGrid = ({
  sharedFolders,
  setSharedFolderId,
}: {
  sharedFolders: MinimalSharedFolder[];
  setSharedFolderId: (id: string) => void;
}) => {
  const [sort, setSort] = useState<SortType>({
    property: 'name',
    direction: 'asc',
  });
  return (
    <Box>
      <DataTable
        fill={true}
        columns={dataTableColumnConfig}
        data={sharedFolders}
        sort={sort}
        onSort={setSort}
        resizeable
        primaryKey="id"
        onClickRow={({ datum }) => setSharedFolderId(datum.id)}
      />
      {sharedFolders.length === 0 ? (
        <EmptyPlaceholder
          text="You haven't created any links for this folder (or parent folders)
            yet!"
          icon={<VscDebugDisconnect />}
        />
      ) : null}
    </Box>
  );
};
const dataTableColumnConfig: ColumnConfig<MinimalSharedFolder>[] = [
  { property: 'name', header: <Text>Name</Text> },
  {
    property: 'folder',
    header: <Text>Shared Folder</Text>,
    render: ({ folder }) => {
      return folder?.name ?? '';
    },
  },
];

const EmptyPlaceholder = ({
  text,
  icon,
}: {
  text: string;
  icon: ReactNode;
}) => {
  return (
    <Box style={{ opacity: 0.33 }} align="center" pad="medium">
      <Box style={{ fontSize: 72, opacity: 0.5 }} pad="medium">
        {icon}
      </Box>
      <Text textAlign="center">{text}</Text>
    </Box>
  );
};

const generateThumbnailsQuery = gql(/*GraphQL*/ `
mutation generateThumbnailsQuery($folderId: ID!) {
  generateThumbnails(folderId: $folderId)
}`);
