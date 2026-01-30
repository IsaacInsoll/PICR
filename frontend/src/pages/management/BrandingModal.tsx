import { Alert, Button, Group, Modal } from '@mantine/core';
import { BrandingForm } from './BrandingForm';
import { useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import { themeModeAtom } from '../../atoms/themeModeAtom';
import { BrandingWithHeadingFont } from '../../atoms/themeModeAtom';
import { useMutation } from 'urql';
import { DeleteIcon } from '../../PicrIcons';
import { editBrandingMutation } from '@shared/urql/mutations/editBrandingMutation';
import { deleteBrandingMutation } from '@shared/urql/mutations/deleteBrandingMutation';

export const BrandingModal = ({
  branding: brandingProp,
  onClose,
}: {
  branding: BrandingWithHeadingFont;
  onClose: () => void;
}) => {
  const [branding, setBranding] = useState<BrandingWithHeadingFont>({
    ...brandingProp,
  });
  const setThemeMode = useSetAtom(themeModeAtom);
  const [submitting, setSubmitting] = useState(false);
  const [, mutate] = useMutation(editBrandingMutation);
  const [, deleteBranding] = useMutation(deleteBrandingMutation);
  const folder = branding.folder;

  useEffect(() => {
    setThemeMode(branding);
  }, [branding, setThemeMode]);

  const onSave = () => {
    setSubmitting(true);
    mutate({
      folderId: branding.folderId,
      mode: branding.mode,
      primaryColor: branding.primaryColor,
      logoUrl: branding.logoUrl,
      headingFontKey: branding.headingFontKey,
    }).then(() => {
      setSubmitting(false);
      onClose();
    });
  };

  const onDelete = () => {
    setSubmitting(true);
    deleteBranding({ folderId: folder?.id }).then(() => {
      setSubmitting(false);
      onClose();
    });
  };

  const inherited = branding.folder && branding.folderId != branding.folder.id;
  const title = !inherited && folder?.name ? ' for: ' + folder?.name : '';
  return (
    <Modal
      onClose={onClose}
      title={`Manage Branding ${title}`}
      centered
      opened={true}
    >
      {inherited ? (
        <Alert
          mb="md"
          title={
            <>
              This branding is inherited from <em>{branding.folder?.name}</em>
            </>
          }
        >
          You can customise the look for this folder and all its subfolders
        </Alert>
      ) : null}
      <BrandingForm branding={branding} onChange={setBranding} />
      <Group justify="flex-end" mt="lg">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {branding.id && branding?.folderId != 1 ? (
          <Button
            loading={submitting}
            variant="outline"
            onClick={onDelete}
            leftSection={<DeleteIcon />}
          >
            Remove
          </Button>
        ) : null}
        <Button variant="filled" onClick={onSave} loading={submitting}>
          Save
        </Button>
      </Group>
    </Modal>
  );
};
