import { ActionIcon, Button, Group, Tooltip } from '@mantine/core';
import { BrandingForm, type BrandingInput } from './BrandingForm';
import type { SocialLink } from '@shared/branding/socialLinkTypes';
import { useEffect, useRef, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
  themeModeAtom,
  applyBrandingDefaults,
} from '../../atoms/themeModeAtom';
import { useMutation } from 'urql';
import { DeleteIcon, EyeIcon, EyeOffIcon } from '../../PicrIcons';
import { editBrandingMutation } from '@shared/urql/mutations/editBrandingMutation';
import { deleteBrandingMutation } from '@shared/urql/mutations/deleteBrandingMutation';
import {
  normalizeFontKey,
  toHeadingFontKeyEnumValue,
} from '@shared/branding/fontRegistry';
import { PicrDrawer } from '../../components/PicrDrawer';
import { BrandingFolderChips } from '../../components/BrandingFolderChips';

type FolderChip = {
  id: string;
  name?: string | null;
  parents?: Array<{ id: string }> | null;
};

export const BrandingDrawer = ({
  branding: brandingProp,
  onClose,
  onSaved,
  folders,
}: {
  branding: BrandingInput;
  onClose: () => void;
  onSaved?: (id: string) => void;
  folders?: FolderChip[] | null;
}) => {
  const [branding, setBranding] = useState<BrandingInput>({
    ...applyBrandingDefaults(brandingProp),
    socialLinks:
      (brandingProp.socialLinks as SocialLink[] | null | undefined) ?? null,
  });
  const setThemeMode = useSetAtom(themeModeAtom);
  const [submitting, setSubmitting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [, mutate] = useMutation(editBrandingMutation);
  const [, deleteBranding] = useMutation(deleteBrandingMutation);

  const originalTheme = useRef(applyBrandingDefaults(brandingProp));

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
      availableViews: branding.availableViews,
      defaultView: branding.defaultView,
      thumbnailSize: branding.thumbnailSize,
      thumbnailSpacing: branding.thumbnailSpacing,
      thumbnailBorderRadius: branding.thumbnailBorderRadius,
      headingFontSize: branding.headingFontSize,
      headingAlignment: branding.headingAlignment,
      footerTitle: branding.footerTitle,
      footerUrl: branding.footerUrl,
      socialLinks: branding.socialLinks,
    }).then(({ data }) => {
      setSubmitting(false);
      const savedId = data?.editBranding?.id;
      if (savedId) onSaved?.(savedId);
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

  const onCancel = () => {
    setThemeMode(originalTheme.current);
    onClose();
  };

  const titleText = isNew
    ? 'Create Branding'
    : `Edit Branding: ${branding.name}`;
  const title = (
    <Group gap="xs" wrap="nowrap">
      <span>{titleText}</span>
      <Tooltip label={showOverlay ? 'Preview gallery' : 'Show overlay'}>
        <ActionIcon
          variant="subtle"
          size="sm"
          color={showOverlay ? 'gray' : 'blue'}
          onClick={() => setShowOverlay((v) => !v)}
        >
          {!showOverlay ? <EyeIcon /> : <EyeOffIcon />}
        </ActionIcon>
      </Tooltip>
    </Group>
  );

  return (
    <PicrDrawer title={title} onClose={onCancel} withOverlay={showOverlay}>
      <BrandingFolderChips folders={folders} />
      <BrandingForm branding={branding} onChange={setBranding} showName />
      <Group justify="flex-end" mt="lg">
        <Button variant="outline" onClick={onCancel}>
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
    </PicrDrawer>
  );
};
