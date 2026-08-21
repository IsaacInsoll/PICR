import type { PicrFolder } from '@shared/types/picr';
import { useState } from 'react';
import { useMutation } from 'urql';
import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  PasswordInput,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import {
  DeleteIcon,
  SaveIcon,
  UserIcon,
  EmailIcon,
  NotificationIcon,
} from '../../PicrIcons';
import { FolderSelector } from '../../components/FolderSelector';
import type { MutationEditAdminUserArgs } from '@shared/gql/graphql';
import { CommentPermissions } from '@shared/gql/graphql';
import { useViewUser } from './useViewUser';
import { CommentPermissionsSelector } from '../../components/CommentPermissionsSelector';
import { ErrorAlert } from '../../components/ErrorAlert';
import { editAdminUserMutation } from '@shared/urql/mutations/editAdminUserMutation';
import { deleteUserMutation } from '@shared/urql/mutations/deleteUserMutation';
import { useTranslation } from 'react-i18next';
import { useFolderNameFormatter } from '../../i18n/useFolderNameFormatter';

export const ManageUser = ({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) => {
  const { t } = useTranslation('admin');
  const formatFolderName = useFolderNameFormatter();
  const [user, exists] = useViewUser(id);
  const [, mutate] = useMutation(editAdminUserMutation);
  const [, deleteUser] = useMutation(deleteUserMutation);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState<string>(user?.username ?? '');
  const [password, setPassword] = useState<string | null>(null);
  const [ntfy, setNtfy] = useState<string | null>(user?.ntfy ?? null);
  const [ntfyEmail, setNtfyEmail] = useState<boolean>(user?.ntfyEmail ?? false);
  const [enabled, setEnabled] = useState(user?.enabled ?? true);
  const [commentPermissions, setCommentPermissions] =
    useState<CommentPermissions>(
      user?.commentPermissions ?? CommentPermissions.Edit,
    );
  const [folder, setFolder] = useState<PicrFolder>(
    user?.folder ?? {
      id: '1',
      name: 'Home',
      parentId: null,
      parents: [],
    },
  );
  const [error, setError] = useState('');

  const invalidUsername = username === '' || name === '';
  const isRootAdmin = id === '1';
  const folderName = formatFolderName(folder);

  const onDelete = () => {
    if (!id || isRootAdmin) return;
    void deleteUser({ id }).then(({ error }) => {
      if (error) {
        setError(error.toString());
      } else {
        onClose();
      }
    });
  };

  const onSave = () => {
    //TODO: not pass password if it's null or ''
    setError('');
    const data: MutationEditAdminUserArgs = {
      ...(id ? { id } : {}),
      name,
      username: username,
      password: password,
      enabled,
      folderId: folder.id,
      commentPermissions,
      ntfy,
      ntfyEmail,
    };
    void mutate(data).then(({ error }) => {
      if (error) {
        setError(error.toString());
      } else {
        onClose();
      }
    });
  };

  return (
    <Modal
      onClose={onClose}
      title={
        folder.id !== '1'
          ? t('users.editor.titleForFolder', { folder: folderName })
          : t('users.editor.title')
      }
      centered
      opened={true}
      size="xl"
    >
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" verticalSpacing="md">
          <Stack gap="md">
            <Divider label={t('users.editor.account')} labelPosition="left" />
            <TextInput
              leftSection={<UserIcon />}
              placeholder={t('users.editor.namePlaceholder')}
              value={name}
              label={t('users.editor.name')}
              onChange={(e) => setName(e.currentTarget.value)}
            />

            <TextInput
              leftSection={<EmailIcon />}
              placeholder={t('users.editor.emailPlaceholder')}
              value={username}
              label={t('users.editor.email')}
              onChange={(e) => setUsername(e.currentTarget.value)}
            />

            <PasswordInput
              // leftSection={<TbPassword />}
              // placeholder="randomchars"
              value={password ?? ''}
              label={t('users.editor.password')}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />

            <Switch
              checked={enabled}
              label={t('users.editor.enabled')}
              description={t('users.editor.enabledDescription')}
              onChange={(event) => setEnabled(event.currentTarget.checked)}
            />
          </Stack>

          <Stack gap="md">
            <Divider label={t('users.editor.access')} labelPosition="left" />
            <FolderSelector folder={folder} setFolder={setFolder} />

            <CommentPermissionsSelector
              value={commentPermissions}
              onChange={setCommentPermissions}
            />
          </Stack>
        </SimpleGrid>

        <Stack gap="md">
          <Divider
            label={t('users.editor.notifications')}
            labelPosition="left"
          />
          <SimpleGrid
            cols={{ base: 1, sm: 2 }}
            spacing="lg"
            verticalSpacing="md"
          >
            <TextInput
              leftSection={<NotificationIcon />}
              placeholder={t('users.editor.ntfyPlaceholder')}
              value={ntfy ?? ''}
              label={t('users.editor.ntfyUrl')}
              description={t('users.editor.ntfyDescription')}
              onChange={(e) => setNtfy(e.currentTarget.value)}
            />

            <Switch
              checked={ntfyEmail}
              label={t('users.editor.ntfyEmail')}
              description={t('users.editor.ntfyEmailDescription')}
              disabled={!ntfy}
              onChange={(event) => setNtfyEmail(event.currentTarget.checked)}
            />
          </SimpleGrid>
        </Stack>

        <ErrorAlert message={error} />

        <Box
          bg="var(--mantine-color-body)"
          pt="sm"
          style={{ position: 'sticky', bottom: 0, zIndex: 1 }}
        >
          <Group justify="space-between" align="center">
            {exists && !isRootAdmin ? (
              <Button
                color="red"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                leftSection={<DeleteIcon />}
              >
                {t('common.delete')}
              </Button>
            ) : (
              <Box />
            )}
            <Button disabled={invalidUsername} onClick={onSave}>
              <SaveIcon />
              {exists ? t('common.save') : t('users.editor.create')}
            </Button>
          </Group>
        </Box>
      </Stack>

      <Modal
        opened={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('users.editor.deleteTitle')}
        centered
        size="sm"
      >
        <Stack>
          <Text>{t('users.editor.deleteConfirmation')}</Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setShowDeleteConfirm(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={onDelete} leftSection={<DeleteIcon />}>
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Modal>
  );
};
