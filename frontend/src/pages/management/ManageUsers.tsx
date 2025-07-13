import { Box, Button } from '@mantine/core';
import { useQuery } from 'urql';
import { viewAdminsQuery } from '@shared/urql/queries/viewAdminsQuery';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';
import { Suspense, useState } from 'react';
import QueryFeedback from '../../components/QueryFeedback';
import { PicrDataGrid } from '../../components/PicrDataGrid';
import { ManageUser } from './ManageUser';
import { TbUserPlus } from 'react-icons/tb';
import { userColumns } from './userColumns';

export const ManageUsers = () => {
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
            }}
            id={userId}
          />
        </Suspense>
      ) : null}
      {result.data?.admins ? (
        <PicrDataGrid
          columns={userColumns}
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
