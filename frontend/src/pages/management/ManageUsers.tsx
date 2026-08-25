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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('admin');
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
    // This grid lists admin users, who have no `expiresAt`, so their status is
    // decided entirely by `enabled` and needs no clock. If expiry ever applies
    // to admins, switch this to `publicLinkStatus(user, now)`.
    return normalizedSearch
      ? allUsers.filter((user) =>
          userSearchText(
            user,
            t,
            user.enabled ? 'active' : 'disabled',
          ).includes(normalizedSearch),
        )
      : allUsers;
  }, [normalizedSearch, t, users]);

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
                placeholder={t('users.search')}
                leftSection={<SearchIcon />}
                style={{ flexGrow: 1, maxWidth: 420 }}
              />
              <Text size="sm" c="dimmed" pb={6}>
                {t('users.filteredCount', {
                  visible: filteredUsers.length,
                  total: users?.length ?? 0,
                })}
              </Text>
            </Group>
            <Button onClick={createUser} leftSection={<AddUserIcon />}>
              {t('users.add')}
            </Button>
          </Group>
          <PicrDataGrid
            columns={userColumns(t)}
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
