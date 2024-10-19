import { Box, Button, Text, Title } from '@mantine/core';
import { Page } from '../../components/Page';
import { useQuery } from 'urql';
import { viewAdminsQuery } from '../../urql/queries/viewAdminsQuery';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';
import { Suspense, useState } from 'react';
import QueryFeedback from '../../components/QueryFeedback';
import { PicrColumns, PicrDataGrid } from '../../components/PicrDataGrid';
import { User } from '../../../../graphql-types';
import { ManageUser } from './ManageUser';
import { TbCircleCheck, TbCircleXFilled, TbUserPlus } from 'react-icons/tb';

export const ManageUsers = () => {
  return (
    <>
      <Text py="md">
        Users who manage folders can manage users attached to its subfolders
      </Text>
      <Suspense fallback={<ModalLoadingIndicator />}>
        <ManageUsersBody />
      </Suspense>
    </>
  );
};

const ManageUsersBody = () => {
  const [result, reQuery] = useQuery({ query: viewAdminsQuery });
  const [userId, setUserId] = useState<string | null>(null);

  // console.log(result.data);
  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      {userId !== null ? (
        <Suspense fallback={<ModalLoadingIndicator />}>
          <ManageUser
            onClose={() => {
              setUserId(null);
              reQuery({ requestPolicy: 'network-only' });
            }}
            id={userId}
          />
        </Suspense>
      ) : null}
      {result.data?.admins ? (
        <PicrDataGrid
          columns={columns}
          data={result.data?.admins}
          onClick={(row) => setUserId(row.id)}
        />
      ) : undefined}
      <Box pt="md">
        <Button onClick={() => setUserId('')} leftSection={<TbUserPlus />}>
          Add User
        </Button>
      </Box>
    </>
  );
};

const columns: PicrColumns<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'folder.name', header: 'Folder' }, //TODO: show parent folders if any
  {
    accessorKey: 'enabled',
    header: 'Enabled',
    accessorFn: ({ enabled }) =>
      enabled ? (
        <TbCircleCheck style={{ color: 'green' }} />
      ) : (
        <TbCircleXFilled style={{ color: 'red' }} />
      ),
  },
];
