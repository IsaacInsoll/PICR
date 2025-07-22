import { MinimalFolder } from '../../../types';
import { randomString } from '../../helpers/randomString';
import { useState } from 'react';
import { useMutation } from 'urql';
import { editUserMutation } from '@shared/urql/mutations/editUserMutation';
import type { MutationEditUserArgs } from '@shared/gql/graphql';
import {
  ActionIcon,
  Button,
  Checkbox,
  Code,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  TbCloudUpload,
  TbLabel,
  TbRefresh,
  TbUsersGroup,
} from 'react-icons/tb';
import { useViewUser } from './useViewUser';
import { CommentPermissionsSelector } from '../../components/CommentPermissionsSelector';
import { CommentPermissions } from '../../../../graphql-types';
import { EmailIcon, PublicLinkIcon } from '../../PicrIcons';
import { CopyPublicLinkButton } from './CopyPublicLinkButton';
import { ErrorAlert } from '../../components/ErrorAlert';
import { badChars } from '../../../../backend/graphql/helpers/badChars';

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

  //get folder from user if they exist as it may be a parent or child
  const f: MinimalFolder = user?.folder ?? folder;

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

  const badLink = badChars(link);
  const invalidLink = badLink.length > 0 || name === '' || link.length < 6;

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
          onChange={(e) => setName(e.target.value)}
          error={name.length == 0 ? 'Name is required' : undefined}
        />
        <TextInput
          leftSection={<EmailIcon />}
          label="Email Address"
          value={username}
          description="(optional)"
          onChange={(e) => setUsername(e.target.value)}
        />

        <Group gap="xs" style={{ alignItems: 'center' }}>
          <TextInput
            style={{ flexGrow: 1 }}
            leftSection={<PublicLinkIcon />}
            placeholder="Link ID (required)"
            value={link}
            label="Public Link"
            description="this should be impossible to guess"
            onChange={(e) => setLink(e.target.value)}
            error={
              badLink.length > 0 ? (
                <Group gap="xs">
                  <Text size="xs">Can't use:</Text>
                  {badLink.map((l) => (
                    <Code key={l}>{l == ' ' ? 'space' : l}</Code>
                  ))}
                </Group>
              ) : link.length < 6 ? (
                'Must be at least 6 characters long'
              ) : undefined
            }
          />
          <Stack style={{ alignContent: 'center' }} gap="xs" pt="xl">
            <Tooltip label="Generate a 'pretty' link">
              <ActionIcon
                variant="default"
                onClick={() => {
                  const pretty =
                    folder?.name?.replaceAll(' ', '-') +
                    '-' +
                    randomString().substring(0, 4);
                  setLink(pretty);
                }}
              >
                <TbLabel />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Generate very-hard-to-guess link">
              <ActionIcon
                variant="default"
                onClick={() => setLink(randomString())}
              >
                <TbRefresh />
              </ActionIcon>
            </Tooltip>
          </Stack>
        </Group>

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
