import { Button, Group, Modal } from '@mantine/core';
import { BrandingForm, type BrandingInput } from './BrandingForm';
import { useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  themeModeAtom,
  applyBrandingDefaults,
} from '../../atoms/themeModeAtom';
import { useMutation } from 'urql';
import { DeleteIcon } from '../../PicrIcons';
import { editBrandingMutation } from '@shared/urql/mutations/editBrandingMutation';
import { deleteBrandingMutation } from '@shared/urql/mutations/deleteBrandingMutation';
import {
  normalizeFontKey,
  toHeadingFontKeyEnumValue,
} from '@shared/branding/fontRegistry';
import type { ViewBrandingsQueryQuery } from '@shared/gql/graphql';

type BrandingRow = NonNullable<ViewBrandingsQueryQuery['brandings'][number]>;

export const BrandingModal = ({
  branding: brandingProp,
  onClose,
}: {
  branding: BrandingRow;
  onClose: () => void;
}) => {
  const [branding, setBranding] = useState<BrandingInput>(
    applyBrandingDefaults(brandingProp),
  );
  const setThemeMode = useSetAtom(themeModeAtom);
  const [submitting, setSubmitting] = useState(false);
  const [, mutate] = useMutation(editBrandingMutation);
  const [, deleteBranding] = useMutation(deleteBrandingMutation);

  const isNew = !branding.id || branding.id === '0';

  useEffect(() => {
    // Only update theme when mode is defined to prevent flickering
    if (branding.mode) {
      setThemeMode(branding as Parameters<typeof setThemeMode>[0]);
    }
  }, [branding, setThemeMode]);

  const onSave = () => {
    setSubmitting(true);
    mutate({
      id: isNew ? undefined : branding.id,
      name: branding.name,
      mode: branding.mode,
      primaryColor: branding.primaryColor,
      logoUrl: branding.logoUrl,
      headingFontKey: toHeadingFontKeyEnumValue(
        normalizeFontKey(branding.headingFontKey),
      ),
    }).then(() => {
      setSubmitting(false);
      onClose();
    });
  };

  const onDelete = () => {
    if (!branding.id) return;
    setSubmitting(true);
    deleteBranding({ id: branding.id }).then(() => {
      setSubmitting(false);
      onClose();
    });
  };

  const title = isNew ? 'Create Branding' : `Edit Branding: ${branding.name}`;

  return (
    <Modal onClose={onClose} title={title} centered opened={true}>
      <BrandingForm branding={branding} onChange={setBranding} showName />
      <Group justify="flex-end" mt="lg">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        {!isNew ? (
          <Button
            loading={submitting}
            variant="outline"
            onClick={onDelete}
            leftSection={<DeleteIcon />}
          >
            Delete
          </Button>
        ) : null}
        <Button
          variant="filled"
          onClick={onSave}
          loading={submitting}
          disabled={isNew && !branding.name?.trim()}
        >
          {isNew ? 'Create' : 'Save'}
        </Button>
      </Group>
    </Modal>
  );
};
