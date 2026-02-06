import { MinimalFolder } from '../../../types';
import { useState } from 'react';
import { useMutation } from 'urql';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { DeleteIcon, SaveIcon, UserIcon } from '../../PicrIcons';
import { FolderSelector } from '../../components/FolderSelector';
import {
  CommentPermissions,
  MutationEditAdminUserArgs,
} from '../../../../graphql-types';
import { useViewUser } from './useViewUser';
import { CommentPermissionsSelector } from '../../components/CommentPermissionsSelector';
import { ErrorAlert } from '../../components/ErrorAlert';
import { EmailIcon, NotificationIcon } from '../../PicrIcons';
import { editAdminUserMutation } from '@shared/urql/mutations/editAdminUserMutation';
import { deleteUserMutation } from '@shared/urql/mutations/deleteUserMutation';

export const ManageUser = ({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) => {
  const [user, exists] = useViewUser(id);
  const [, mutate] = useMutation(editAdminUserMutation);
  const [, deleteUser] = useMutation(deleteUserMutation);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username);
  const [password, setPassword] = useState<string | null>(null);
  const [ntfy, setNtfy] = useState<string | null>(user?.ntfy);
  const [ntfyEmail, setNtfyEmail] = useState<boolean>(
    user?.ntfyEmail ?? false,
  );
  const [enabled, setEnabled] = useState(user?.enabled ?? true);
  const [commentPermissions, setCommentPermissions] =
    useState<CommentPermissions>(
      user?.commentPermissions ?? CommentPermissions.Edit,
    );
  const [folder, setFolder] = useState<MinimalFolder>(
    user?.folder ?? { id: '1' },
  );
  const [error, setError] = useState('');

  const invalidUsername = username === '' || name === '';
  const isRootAdmin = id === '1';

  const onDelete = () => {
    if (!id || isRootAdmin) return;
    deleteUser({ id }).then(({ error }) => {
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
      id: id ?? '',
      name,
      username: username,
      password: password,
      enabled,
      folderId: folder?.id,
      commentPermissions,
      ntfy,
      ntfyEmail,
    };
    mutate(data).then(({ data, error }) => {
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
      title={`Manage User${folder?.id != '1' ? ' for: ' + folder?.name : ''}`}
      centered
      opened={true}
    >
      <Stack gap="lg">
        <TextInput
          leftSection={<UserIcon />}
          placeholder="EG: 'Company CEO' or 'Valentina' (optional)"
          value={name}
          label="Name"
          onChange={(e) => setName(e.target.value)}
        />

        <TextInput
          leftSection={<EmailIcon />}
          placeholder="EG: kimk or kim@k.com"
          value={username}
          label="Email"
          onChange={(e) => setUsername(e.target.value)}
        />

        <PasswordInput
          // leftSection={<TbPassword />}
          // placeholder="randomchars"
          value={password ?? ''}
          label="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <FolderSelector folder={folder} setFolder={setFolder} />

        <CommentPermissionsSelector
          value={commentPermissions}
          onChange={setCommentPermissions}
        />

        <TextInput
          leftSection={<NotificationIcon />}
          placeholder="EG: https://ntfy.sh/xyz"
          value={ntfy}
          label="NTFY Notifications URL"
          description="Get notifications on your phone"
          onChange={(e) => setNtfy(e.target.value)}
        />

        <Checkbox
          checked={ntfyEmail}
          label="Email NTFY notifications"
          description="Also send NTFY alerts to this account email"
          disabled={!ntfy}
          onChange={(event) => setNtfyEmail(event.currentTarget.checked)}
        />

        <Checkbox
          checked={enabled}
          label="Enabled"
          description="Can user log in?"
          onChange={(event) => setEnabled(event.currentTarget.checked)}
        />
        <ErrorAlert message={error} />
        <Group justify="space-between">
          <Button disabled={invalidUsername} onClick={onSave}>
            <SaveIcon />
            {exists ? 'Save' : 'Create User'}
          </Button>
          {exists && !isRootAdmin && (
            <Button
              color="red"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              leftSection={<DeleteIcon />}
            >
              Delete
            </Button>
          )}
        </Group>
      </Stack>

      <Modal
        opened={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete User"
        centered
        size="sm"
      >
        <Stack>
          <Text>
            Are you sure you want to delete this user? This action cannot be
            undone and they will no longer be able to log in.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={onDelete} leftSection={<DeleteIcon />}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Modal>
  );
};
