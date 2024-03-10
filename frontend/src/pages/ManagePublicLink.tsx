import { MinimalFolder } from '../../types';
import { Box, Button, CheckBox, FormField, Layer, TextInput } from 'grommet';
import { Clipboard, Close, CloudUpload, Group, Link } from 'grommet-icons';
import { randomString } from '../helpers/randomString';
import { useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { editPublicLinkMutation } from '../urql/mutations/editPublicLinkMutation';
import type { MutationEditPublicLinkArgs } from '../gql/graphql';
import { link } from 'node:fs';
import { viewPublicLinkQuery } from '../urql/queries/viewPublicLinkQuery';

export const ManagePublicLink = ({
  id,
  folder,
  onClose,
}: {
  id?: string;
  folder?: MinimalFolder; //if creating a new public link
  onClose: () => void;
}) => {
  const [data] = useQuery({
    query: viewPublicLinkQuery,
    variables: { id: id ?? '0' },
    pause: !id,
  });

  const [, mutate] = useMutation(editPublicLinkMutation);

  const [name, setName] = useState('');
  const [link, setLink] = useState(randomString());
  const [enabled, setEnabled] = useState(true);
  // const random = () => {
  //   randomString();
  // };

  const exists = id && id !== '';

  const onSave = () => {
    const data: MutationEditPublicLinkArgs = {
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
          <Button label="Copy Link" icon={<Clipboard />} onClick={onClose} />
          <Button
            label={exists ? 'Save' : 'Create Link'}
            icon={<CloudUpload />}
            primary
            onClick={onSave}
          />
        </Box>
      </Box>
    </Layer>
  );
};
