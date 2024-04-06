import { MinimalFolder } from '../../types';
import { Box, Button, CheckBox, FormField, Layer, TextInput } from 'grommet';
import { Clipboard, Close, CloudUpload, Group, Link } from 'grommet-icons';
import { randomString } from '../helpers/randomString';
import { useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { editUserMutation } from '../urql/mutations/editUserMutation';
import type { MutationEditUserArgs } from '../gql/graphql';
import { viewUserQuery } from '../urql/queries/viewUserQuery';
import { copyToClipboard, publicURLFor } from '../helpers/copyToClipboard';

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
  // const random = () => {
  //   randomString();
  // };

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
    <Layer onEsc={onClose} onClickOutside={onClose}>
      <Box width="large" gap="small" pad="medium" align="center">
        <FormField label="Who is using the link?" style={{ width: '100%' }}>
          <TextInput
            icon={<Group />}
            placeholder="EG: 'Company CEO' or 'Valentina' (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField label="Link" style={{ width: '100%' }}>
          <TextInput
            icon={<Link />}
            placeholder="Link ID (required)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </FormField>
        <FormField label="Enabled" style={{ width: '100%' }}>
          <CheckBox
            checked={enabled}
            label="Link Enabled"
            onChange={(event) => setEnabled(event.target.checked)}
          />
        </FormField>
        <Box direction="row">
          <Button label="Cancel" icon={<Close />} onClick={onClose} />
          <Button
            label="Copy Link"
            icon={<Clipboard />}
            disabled={invalidLink}
            onClick={() => {
              const url = publicURLFor(link, folder!.id);
              console.log(url);
              copyToClipboard(url);
            }}
          />
          <Button
            label={exists ? 'Save' : 'Create Link'}
            disabled={invalidLink}
            icon={<CloudUpload />}
            primary
            onClick={onSave}
          />
        </Box>
      </Box>
    </Layer>
  );
};
