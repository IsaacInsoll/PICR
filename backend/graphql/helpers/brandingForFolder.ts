import type { Branding as BrandingType } from '@shared/gql/graphql.js';
import {
  HeadingAlignment,
  PrimaryColor,
  ThemeMode,
} from '@shared/gql/graphql.js';
import {
  DEFAULT_BORDER_RADIUS,
  DEFAULT_HEADING_FONT_SIZE,
  DEFAULT_SPACING,
  DEFAULT_THUMBNAIL_SIZE,
  normalizeHeadingAlignment,
} from '@shared/branding/galleryPresets.js';
import type { FolderFields } from '../../db/picrDb.js';
import { brandingForId, dbFolderForId } from '../../db/picrDb.js';

const toHeadingAlignmentEnumValue = (
  alignment?: string | null,
): HeadingAlignment =>
  normalizeHeadingAlignment(alignment) === 'center'
    ? HeadingAlignment.Center
    : HeadingAlignment.Left;

export const brandingForFolder = async (
  folder: FolderFields,
): Promise<BrandingType> => {
  let f: FolderFields | undefined = folder;
  while (f) {
    if (f.brandingId) {
      const branding = await brandingForId(f.brandingId);
      if (branding) {
        return {
          ...branding,
          id: String(branding.id),
          folderId:
            branding.folderId == null ? null : String(branding.folderId),
          mode: branding.mode as BrandingType['mode'],
          primaryColor: branding.primaryColor as BrandingType['primaryColor'],
          headingFontKey:
            branding.headingFontKey as BrandingType['headingFontKey'],
          headingAlignment: toHeadingAlignmentEnumValue(
            branding.headingAlignment,
          ),
          folders: [],
        };
      }
    }
    f = await dbFolderForId(f.parentId ?? undefined);
  }
  return {
    id: '0', //urql will complain otherwise
    mode: ThemeMode.Auto,
    primaryColor: PrimaryColor.Blue,
    thumbnailSize: DEFAULT_THUMBNAIL_SIZE,
    thumbnailSpacing: DEFAULT_SPACING,
    thumbnailBorderRadius: DEFAULT_BORDER_RADIUS,
    headingFontSize: DEFAULT_HEADING_FONT_SIZE,
    headingAlignment: HeadingAlignment.Left,
    folders: [],
  };
};
