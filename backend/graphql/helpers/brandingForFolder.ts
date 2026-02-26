import type { Branding as BrandingType } from '@shared/gql/graphql.js';
import { PrimaryColor, ThemeMode } from '@shared/gql/graphql.js';
import type { FolderFields } from '../../db/picrDb.js';
import { brandingForId, dbFolderForId } from '../../db/picrDb.js';

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
    folders: [],
  };
};
