import { ReactNode, Suspense, useState } from 'react';
import {
  Box,
  Button,
  ColumnConfig,
  DataTable,
  Page,
  PageContent,
  SortType,
  Text,
} from 'grommet';
import { useQuery } from 'urql';
import { manageFolderQuery } from '../urql/queries/manageFolderQuery';
import QueryFeedback from '../components/QueryFeedback';
import { Add, DocumentImage } from 'grommet-icons';
import { ManagePublicLink } from './ManagePublicLink';
import { MinimalSharedFolder } from '../../types';
import { VscDebugDisconnect } from 'react-icons/vsc';

export const ManageFolder = ({
  folderId,
  onClose,
}: {
  folderId: string;
  onClose: () => void;
}) => {
  return (
    <Page>
      <PageContent>
        <Suspense>
          <ManageFolderBody folderId={folderId} onClose={onClose} />
        </Suspense>
      </PageContent>
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
  const [linkId, setLinkId] = useState<string | null>(null);
  const { data } = result;
  const totalImages = data?.folder.totalImages;
  return (
    <Box>
      {linkId !== null ? (
        <ManagePublicLink
          onClose={() => {
            setLinkId(null);
            reQuery({ requestPolicy: 'network-only' });
          }}
          id={linkId}
          folder={data?.folder}
        />
      ) : null}
      {data?.users ? (
        <SharedFolderDataGrid
          sharedFolders={data?.users}
          setSharedFolderId={setLinkId}
        />
      ) : null}
      <Box direction="row" gap="small">
        <Button
          label="Create Link"
          icon={<Add />}
          onClick={() => setLinkId('')}
        />
        <Button
          label={`Generate ${totalImages} Thumbnails`}
          icon={<DocumentImage />}
          disabled={!totalImages || totalImages === 0}
        />
        <Box flex="grow"></Box>
        <Button label={`Close Settings`} primary onClick={onClose} />
      </Box>
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
  const [sort, setSort] = useState<SortType>({
    property: 'name',
    direction: 'asc',
  });
  return (
    <Box align="center" pad="large">
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
