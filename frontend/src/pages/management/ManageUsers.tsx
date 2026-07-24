import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useQuery } from 'urql';
import { viewAdminsQuery } from '@shared/urql/queries/viewAdminsQuery';
import { ModalLoadingIndicator } from '../../components/ModalLoadingIndicator';
import { Suspense, useMemo, useState } from 'react';
import QueryFeedback from '../../components/QueryFeedback';
import { PicrDataGrid } from '../../components/PicrDataGrid';
import { ManageUser } from './ManageUser';
import { AddUserIcon, SearchIcon } from '../../PicrIcons';
import { userColumns, userSearchText } from './userColumns';

interface ManageUsersProps {
  selectedUserId?: string | null;
  onSelectUser?: (id: string) => void;
  onCreateUser?: () => void;
  onCloseUser?: () => void;
}

export const ManageUsers = ({
  selectedUserId,
  onSelectUser,
  onCreateUser,
  onCloseUser,
}: ManageUsersProps) => {
  const [result, reQuery] = useQuery({ query: viewAdminsQuery });
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const isControlled =
    selectedUserId !== undefined ||
    onSelectUser != null ||
    onCreateUser != null ||
    onCloseUser != null;
  const userId = isControlled ? (selectedUserId ?? null) : localUserId;
  const manageUserId = userId === NEW_ITEM_SLUG ? '' : userId;
  const users = result.data?.admins;
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    const allUsers = users ?? [];
    return normalizedSearch
      ? allUsers.filter((user) =>
          userSearchText(user).includes(normalizedSearch),
        )
      : allUsers;
  }, [normalizedSearch, users]);

  const selectUser = (id: string) => {
    if (onSelectUser) {
      onSelectUser(id);
      return;
    }

    setLocalUserId(id);
  };

  const createUser = () => {
    if (onCreateUser) {
      onCreateUser();
      return;
    }

    setLocalUserId('');
  };

  const closeUser = () => {
    if (onCloseUser) {
      onCloseUser();
      return;
    }

    setLocalUserId(null);
  };

  // console.log(result.data);
  return (
    <>
      <QueryFeedback result={result} reQuery={reQuery} />
      {userId !== null ? (
        <Suspense fallback={<ModalLoadingIndicator />}>
          <ManageUser
            key={manageUserId ?? NEW_ITEM_SLUG}
            onClose={closeUser}
            id={manageUserId ?? ''}
          />
        </Suspense>
      ) : null}
      {result.data?.admins ? (
        <Stack gap="sm">
          <Group justify="space-between" align="flex-end">
            <Group align="flex-end" style={{ flexGrow: 1 }}>
              <TextInput
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search users"
                leftSection={<SearchIcon />}
                style={{ flexGrow: 1, maxWidth: 420 }}
              />
              <Text size="sm" c="dimmed" pb={6}>
                {filteredUsers.length} of {users?.length ?? 0}
              </Text>
            </Group>
            <Button onClick={createUser} leftSection={<AddUserIcon />}>
              Add User
            </Button>
          </Group>
          <PicrDataGrid
            columns={userColumns}
            data={filteredUsers}
            onClick={(row) => {
              if (row.id) selectUser(row.id);
            }}
          />
        </Stack>
      ) : undefined}
    </>
  );
};

const NEW_ITEM_SLUG = 'new';
