import type { TFunction } from 'i18next';
import type { MetadataDescriptionTranslator } from '@shared/fileMetadata';

export type GalleryT = TFunction<'gallery'>;

export const fileTypeLabel = (type: string, t: GalleryT): string => {
  switch (type) {
    case 'Folder':
      return t('file.types.folder', { ns: 'gallery' });
    case 'Image':
      return t('file.types.image', { ns: 'gallery' });
    case 'Video':
      return t('file.types.video', { ns: 'gallery' });
    default:
      return t('file.types.file', { ns: 'gallery' });
  }
};

export const metadataDescriptionTranslator =
  (t: GalleryT): MetadataDescriptionTranslator =>
  (key) =>
    t(`metadata.${key}`, { ns: 'gallery' });
