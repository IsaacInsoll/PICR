import { MinimalFolder } from '../../../types';
import { useState } from 'react';
import { useMutation } from 'urql';
import { editAdminUserMutation } from '../../urql/mutations/editUserMutation';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core';
import { TbCloudUpload, TbUser } from 'react-icons/tb';
import { FolderSelector } from '../../components/FolderSelector';
import {
  CommentPermissions,
  MutationEditAdminUserArgs,
} from '../../../../graphql-types';
import { useViewUser } from './useViewUser';
import { CommentPermissionsSelector } from '../../components/CommentPermissionsSelector';
import { ErrorAlert } from '../../components/ErrorAlert';
import { EmailIcon } from '../../PicrIcons';

export const ManageUser = ({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) => {
  const [user, exists] = useViewUser(id);
  const [, mutate] = useMutation(editAdminUserMutation);

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username);
  const [password, setPassword] = useState<string | null>(null);
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
          leftSection={<TbUser />}
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

        <CommentPermissionsSelector
          value={commentPermissions}
          onChange={setCommentPermissions}
        />

        <FolderSelector folder={folder} setFolder={setFolder} />

        <Checkbox
          checked={enabled}
          label="Enabled"
          description="Can user log in?"
          onChange={(event) => setEnabled(event.currentTarget.checked)}
        />
        <ErrorAlert message={error} />
        <Group>
          <Button disabled={invalidUsername} onClick={onSave}>
            <TbCloudUpload />
            {exists ? 'Save' : 'Create User'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
