import { MinimalFolder } from '../../types';
import { randomString } from '../helpers/randomString';
import { useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { editUserMutation } from '../urql/mutations/editUserMutation';
import type { MutationEditUserArgs } from '../gql/graphql';
import { viewUserQuery } from '../urql/queries/viewUserQuery';
import { copyToClipboard, publicURLFor } from '../helpers/copyToClipboard';
import {
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  TextInput,
} from '@mantine/core';
import {
  TbClipboard,
  TbCloudUpload,
  TbDoorExit,
  TbLink,
  TbUsersGroup,
} from 'react-icons/tb';
import { notifications } from '@mantine/notifications';

export const ManagePublicLink = ({
  id,
  folder,
  onClose,
}: {
  id?: string;
  folder?: MinimalFolder; //if creating a new public link
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
  const [link, setLink] = useState(data?.uuid ?? randomString());
  const [enabled, setEnabled] = useState(data?.enabled ?? true);

  const exists = id && id !== '';
  const invalidLink = link === '' || name === '';

  const onSave = () => {
    const data: MutationEditUserArgs = {
      id: id ?? '',
      name,
      uuid: link,
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

  return (
    <Modal
      onClose={onClose}
      title={`Manage Public Link for: ${folder?.name}`}
      centered
      opened={true}
    >
      <Stack gap="lg">
        <TextInput
          leftSection={<TbUsersGroup />}
          placeholder="EG: 'Company CEO' or 'Valentina' (optional)"
          value={name}
          label="Who is using this link?"
          description="only you will see this name"
          onChange={(e) => setName(e.target.value)}
        />

        <TextInput
          leftSection={<TbLink />}
          placeholder="Link ID (required)"
          value={link}
          label="Public Link"
          description="this should be impossible to guess"
          onChange={(e) => setLink(e.target.value)}
        />

        <Checkbox
          checked={enabled}
          label="Enabled"
          description="link will only work if this is 'on'"
          onChange={(event) => setEnabled(event.currentTarget.checked)}
        />
        <Group>
          <Button onClick={onClose}>
            <TbDoorExit />
            Cancel
          </Button>
          <Button
            disabled={invalidLink}
            onClick={() => {
              const url = publicURLFor(link, folder!.id);
              copyToClipboard(url);
              notifications.show({
                title: 'Link copied to clipboard',
                message: url,
                icon: <TbClipboard />,
              });
            }}
          >
            <TbClipboard />
            Copy Link
          </Button>
          <Button disabled={invalidLink} onClick={onSave}>
            <TbCloudUpload />
            {exists ? 'Save' : 'Create Link'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
