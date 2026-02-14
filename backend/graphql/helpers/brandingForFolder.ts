import {
  Branding as BrandingType,
  PrimaryColor,
  ThemeMode,
} from '../../../graphql-types.js';
import { brandingForId, dbFolderForId, FolderFields } from '../../db/picrDb.js';

export const brandingForFolder = async (
  folder: FolderFields,
): Promise<BrandingType> => {
  let f: FolderFields | undefined = folder;
  while (f) {
    if (f.brandingId) {
      const branding = await brandingForId(f.brandingId);
      if (branding) {
        // @ts-expect-error GraphQL result omits full folder tree here by design
        return { ...branding, folder: f };
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
