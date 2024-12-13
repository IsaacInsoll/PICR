import { MinimalFolder } from '../../../types';
import { randomString } from '../../helpers/randomString';
import { useState } from 'react';
import { useMutation } from 'urql';
import { editUserMutation } from '../../urql/mutations/editUserMutation';
import type { MutationEditUserArgs } from '../../gql/graphql';
import {
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  TextInput,
} from '@mantine/core';
import { TbCloudUpload, TbDoorExit, TbUsersGroup } from 'react-icons/tb';
import { useViewUser } from './useViewUser';
import { CommentPermissionsSelector } from '../../components/CommentPermissionsSelector';
import { CommentPermissions } from '../../../../graphql-types';
import { PublicLinkIcon, EmailIcon } from '../../PicrIcons';
import { CopyPublicLinkButton } from './CopyPublicLinkButton';
import { ErrorAlert } from '../../components/ErrorAlert';

export const ManagePublicLink = ({
  id,
  folder,
  onClose,
}: {
  id?: string;
  folder?: MinimalFolder; //if creating a new public link
  onClose: () => void;
}) => {
  const [user, exists] = useViewUser(id);
  const [, mutate] = useMutation(editUserMutation);

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [link, setLink] = useState(user?.uuid ?? randomString());
  const [enabled, setEnabled] = useState(user?.enabled ?? true);
  const [commentPermissions, setCommentPermissions] =
    useState<CommentPermissions>(user?.commentPermissions ?? 'none');
  const [error, setError] = useState('');

  const invalidLink = link === '' || name === '';

  //get folder from user if they exist as it may be a parent or child
  const f: MinimalFolder = user?.folder ?? folder;

  console.log(f);
  const onSave = () => {
    setError('');
    const data: MutationEditUserArgs = {
      id: id ?? '',
      name,
      uuid: link,
      enabled,
      folderId: f?.id,
      commentPermissions,
      username,
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
      title={
        <>
          Public Link for: <em>{f?.name}</em>{' '}
        </>
      }
      centered
      opened={true}
    >
      <Stack gap="lg">
        <TextInput
          leftSection={<TbUsersGroup />}
          placeholder="EG: 'Company CEO' or 'Valentina' (optional)"
          value={name}
          label="Name"
          // description="only you will see this name"
          onChange={(e) => setName(e.target.value)}
        />
        <TextInput
          leftSection={<EmailIcon />}
          label="Email Address"
          value={username}
          description="(optional)"
          onChange={(e) => setUsername(e.target.value)}
        />

        <TextInput
          leftSection={<PublicLinkIcon />}
          placeholder="Link ID (required)"
          value={link}
          label="Public Link"
          description="this should be impossible to guess"
          onChange={(e) => setLink(e.target.value)}
        />

        <CommentPermissionsSelector
          value={commentPermissions}
          onChange={setCommentPermissions}
        />

        <Checkbox
          checked={enabled}
          label="Enabled"
          description="link will only work if this is 'on'"
          onChange={(event) => setEnabled(event.currentTarget.checked)}
        />
        <ErrorAlert message={error} />
        <Group>
          <CopyPublicLinkButton
            disabled={invalidLink}
            folderId={f!.id}
            hash={link}
          />
          <Button disabled={invalidLink} onClick={onSave}>
            <TbCloudUpload />
            {exists ? 'Save' : 'Create Link'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
