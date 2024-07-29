import { MinimalFolder } from '../../types';
import { useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { editUserMutation } from '../urql/mutations/editUserMutation';
import type { MutationEditUserArgs } from '../gql/graphql';
import { viewUserQuery } from '../urql/queries/viewUserQuery';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core';
import { TbCloudUpload, TbDoorExit, TbPassword, TbUser } from 'react-icons/tb';
import { FolderSelector } from '../components/FolderSelector';

export const ManageUser = ({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) => {
  const [response] = useQuery({
    query: viewUserQuery,
    variables: { id: id ?? '0' },
    pause: !id,
  });

  const data = response.data?.user;
  const [, mutate] = useMutation(editUserMutation);

  const [name, setName] = useState(data?.name ?? '');
  const [username, setUsername] = useState(data?.username);
  const [password, setPassword] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(data?.enabled ?? true);
  const [folder, setFolder] = useState<MinimalFolder>(
    data?.folder ?? { id: '1' },
  );

  const exists = id && id !== '';
  const invalidUsername = username === '' || name === '';

  const onSave = () => {
    //TODO: not pass password if it's null or ''
    const data: MutationEditUserArgs = {
      id: id ?? '',
      name,
      username: username,
      password: password,
      enabled,
      folderId: folder?.id,
    };
    mutate(data).then(({ data, error }) => {
      if (error) {
        console.log(error);
        alert(error);
      } else {
        onClose();
      }
    });
  };

  // console.log(data);

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
          leftSection={<TbUser />}
          placeholder="EG: kimk"
          value={username}
          label="Username"
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

        <Checkbox
          checked={enabled}
          label="Enabled"
          description="Can user log in?"
          onChange={(event) => setEnabled(event.currentTarget.checked)}
        />
        <Group>
          <Button onClick={onClose} variant="outline">
            <TbDoorExit />
            Cancel
          </Button>
          <Button disabled={invalidUsername} onClick={onSave}>
            <TbCloudUpload />
            {exists ? 'Save' : 'Create Link'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
