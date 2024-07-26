import { Title } from '@mantine/core';
import { Page } from '../components/Page';
import { useQuery } from 'urql';

export const ManageUsers = () => {
  return (
    <Page>
      <Title>Manage Users</Title>
    </Page>
  );
};

const ManageUsersBody = () => {
  const [result, requery] = useQuery();
};
