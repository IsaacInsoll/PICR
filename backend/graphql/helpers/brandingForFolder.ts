import {
  Branding as BrandingType,
  PrimaryColor,
  ThemeMode,
} from "../../../graphql-types.js";
import {
  brandingForFolderId,
  dbFolderForId,
  FolderFields,
} from "../../db/picrDb.js";

export const brandingForFolder = async (
  folder: FolderFields,
): Promise<BrandingType> => {
  let f: FolderFields | undefined = folder;
  while (f) {
    const branding = await brandingForFolderId(f.id);
    if (branding) {
      // @ts-ignore unreasonable to expect parent/child folders on this query
      return { ...branding, folder: f };
    } else {
      f = await dbFolderForId(f.parentId ?? undefined);
    }
  }
  return {
    folderId: '',
    id: '0', //urql will complain otherwise
    mode: ThemeMode.Auto,
    primaryColor: PrimaryColor.Blue,
  };
};
