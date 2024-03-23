import { Suspense, useState } from 'react';
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
import { Add } from 'grommet-icons';
import { ManagePublicLink } from './ManagePublicLink';
import { MinimalSharedFolder } from '../../types';

export const ManageFolder = ({ folderId }: { folderId: string }) => {
  return (
    <Page>
      <PageContent>
        <Suspense>
          <ManageFolderBody folderId={folderId} />
        </Suspense>
      </PageContent>
    </Page>
  );
};

const ManageFolderBody = ({ folderId }: { folderId: string }) => {
  const [result, reQuery] = useQuery({
    query: manageFolderQuery,
    variables: { folderId },
    // context: headers,
  });
  const [linkId, setLinkId] = useState<string | null>(null);
  const { data } = result;
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
      {data?.users && data.users.length > 0 ? (
        <SharedFolderDataGrid
          sharedFolders={data?.users}
          setSharedFolderId={setLinkId}
        />
      ) : null}
      <Button
        label="Create Link"
        icon={<Add />}
        onClick={() => setLinkId('')}
      />
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
