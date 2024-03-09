import { MinimalFolder } from '../../types';
import { Box, Button, CheckBox, FormField, Layer, TextInput } from 'grommet';
import { Clipboard, Close, CloudUpload, Group, Link } from 'grommet-icons';
import { randomString } from '../helpers/randomString';
import { useState } from 'react';

export const ManagePublicLink = ({
  id,
  folder,
  onClose,
}: {
  id?: number;
  folder?: MinimalFolder; //if creating a new public link
  onClose: () => void;
}) => {
  const [name, setName] = useState('');
  const [link, setLink] = useState(randomString());
  const [enabled, setEnabled] = useState(true);
  // const random = () => {
  //   randomString();
  // };

  const exists = id && id > 0;

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
            onClick={onClose}
          />
        </Box>
      </Box>
    </Layer>
  );
};
