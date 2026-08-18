import { ActionIcon, Button, Group, Tooltip } from '@mantine/core';
import { BrandingForm, type BrandingInput } from './BrandingForm';
import type { SocialLink } from '@shared/branding/socialLinkTypes';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
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
import { GalleryLayout, HeadingAlignment } from '@shared/gql/graphql';
import { PicrDrawer } from '../../components/PicrDrawer';
import { BrandingFolderChips } from '../../components/BrandingFolderChips';
import { useDebouncedValue } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

const TEXT_PREVIEW_DELAY_MS = 150;

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
  const { t } = useTranslation('admin');
  const [branding, setBranding] = useState<BrandingInput>({
    ...applyBrandingDefaults(brandingProp),
    socialLinks:
      (brandingProp.socialLinks as SocialLink[] | null | undefined) ?? null,
  });
  const currentThemeMode = useAtomValue(themeModeAtom);
  const setThemeMode = useSetAtom(themeModeAtom);
  const [submitting, setSubmitting] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [, mutate] = useMutation(editBrandingMutation);
  const [, deleteBranding] = useMutation(deleteBrandingMutation);
  const textPreviewFields = useMemo(
    () => ({
      footerTitle: branding.footerTitle,
      footerUrl: branding.footerUrl,
      logoUrl: branding.logoUrl,
      socialLinks: branding.socialLinks,
    }),
    [
      branding.footerTitle,
      branding.footerUrl,
      branding.logoUrl,
      branding.socialLinks,
    ],
  );
  const [debouncedTextPreviewFields] = useDebouncedValue(
    textPreviewFields,
    TEXT_PREVIEW_DELAY_MS,
  );
  const previewBranding = useMemo(
    () =>
      applyBrandingDefaults({
        availableViews: branding.availableViews,
        defaultFileSort: branding.defaultFileSort,
        defaultView: branding.defaultView,
        galleryLayout: branding.galleryLayout,
        footerTitle: debouncedTextPreviewFields.footerTitle,
        footerUrl: debouncedTextPreviewFields.footerUrl,
        headingAlignment: branding.headingAlignment,
        headingFontKey: branding.headingFontKey,
        headingFontSize: branding.headingFontSize,
        logoUrl: debouncedTextPreviewFields.logoUrl,
        mode: branding.mode,
        primaryColor: branding.primaryColor,
        socialLinks: debouncedTextPreviewFields.socialLinks,
        thumbnailBorderRadius: branding.thumbnailBorderRadius,
        thumbnailSize: branding.thumbnailSize,
        thumbnailSpacing: branding.thumbnailSpacing,
      }),
    [
      branding.availableViews,
      branding.defaultFileSort,
      branding.defaultView,
      branding.galleryLayout,
      branding.headingAlignment,
      branding.headingFontKey,
      branding.headingFontSize,
      branding.mode,
      branding.primaryColor,
      branding.thumbnailBorderRadius,
      branding.thumbnailSize,
      branding.thumbnailSpacing,
      debouncedTextPreviewFields.footerTitle,
      debouncedTextPreviewFields.footerUrl,
      debouncedTextPreviewFields.logoUrl,
      debouncedTextPreviewFields.socialLinks,
    ],
  );

  const originalTheme = useRef(currentThemeMode);

  const isNew = !branding.id || branding.id === '0';

  useEffect(() => {
    setThemeMode(previewBranding);
  }, [previewBranding, setThemeMode]);

  const onSave = () => {
    setSubmitting(true);
    void mutate({
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
      galleryLayout: branding.galleryLayout ?? GalleryLayout.Justified,
      defaultFileSort: branding.defaultFileSort,
      thumbnailSize: branding.thumbnailSize,
      thumbnailSpacing: branding.thumbnailSpacing,
      thumbnailBorderRadius: branding.thumbnailBorderRadius,
      headingFontSize: branding.headingFontSize,
      headingAlignment: branding.headingAlignment ?? HeadingAlignment.Left,
      footerTitle: branding.footerTitle,
      footerUrl: branding.footerUrl,
      socialLinks: branding.socialLinks,
    }).then(({ data }) => {
      setSubmitting(false);
      const savedId = data?.editBranding.id;
      if (savedId) onSaved?.(savedId);
      onClose();
    });
  };

  const onDelete = () => {
    if (!branding.id) return;
    setSubmitting(true);
    void deleteBranding({ id: branding.id }).then(() => {
      setSubmitting(false);
      onClose();
    });
  };

  const onCancel = () => {
    setThemeMode(originalTheme.current);
    onClose();
  };

  const titleText = isNew
    ? t('branding.drawer.createTitle')
    : t('branding.drawer.editTitle', { name: branding.name });
  const title = (
    <Group gap="xs" wrap="nowrap">
      <span>{titleText}</span>
      <Tooltip
        label={
          showOverlay
            ? t('branding.drawer.previewGallery')
            : t('branding.drawer.showOverlay')
        }
      >
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
          {t('common.cancel')}
        </Button>
        {!isNew ? (
          <Button
            loading={submitting}
            variant="outline"
            onClick={onDelete}
            leftSection={<DeleteIcon />}
          >
            {t('common.delete')}
          </Button>
        ) : null}
        <Button
          variant="filled"
          onClick={onSave}
          loading={submitting}
          disabled={isNew && !branding.name?.trim()}
        >
          {isNew ? t('branding.drawer.create') : t('common.save')}
        </Button>
      </Group>
    </PicrDrawer>
  );
};
