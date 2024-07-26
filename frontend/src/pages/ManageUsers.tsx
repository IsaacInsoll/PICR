import { Title } from '@mantine/core';
import { Page } from '../components/Page';
import { useQuery } from 'urql';
import { viewAdminsQuery } from '../urql/queries/viewAdminsQuery';
import { ModalLoadingIndicator } from '../components/ModalLoadingIndicator';
import { Suspense } from 'react';
import QueryFeedback from '../components/QueryFeedback';

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
      yo
    </>
  );
};
