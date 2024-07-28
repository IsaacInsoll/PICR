import { Title } from '@mantine/core';
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
      <Title>Manage Users</Title>
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
        onClick={(row) => console.log}
      />
    </>
  );
};

const columns: PicrColumns<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'username', header: 'Username' },
  // { accessorKey: 'folder', header: 'Folder' },
];
