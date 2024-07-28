import { Title, Text } from '@mantine/core';
import { Page } from '../components/Page';
import { useQuery } from 'urql';
import { viewAdminsQuery } from '../urql/queries/viewAdminsQuery';
import { ModalLoadingIndicator } from '../components/ModalLoadingIndicator';
import { Suspense } from 'react';
import QueryFeedback from '../components/QueryFeedback';
import { PicrColumns, PicrDataGrid } from '../components/PicrDataGrid';
import { User } from '../../../graphql-types';

export const ManageUsers = () => {
  return (
    <Page>
      <Title pt="xl">Manage Users</Title>
      <Text py="md">
        Users who manage folders can manage users attached to its subfolders
      </Text>
      <Suspense fallback={<ModalLoadingIndicator />}>
        <ManageUsersBody />
      </Suspense>
    </Page>
  );
};

const ManageUsersBody = () => {
  const [result, reQuery] = useQuery({ query: viewAdminsQuery });
  console.log(result.data);
  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      <PicrDataGrid
        columns={columns}
        data={result.data.admins}
        onClick={(row) => console.log(row)}
      />
    </>
  );
};

const columns: PicrColumns<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'folder.name', header: 'Folder' }, //TODO: show parent folders if any
];
