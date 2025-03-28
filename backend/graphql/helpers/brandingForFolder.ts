import FolderModel from '../../db/sequelize/FolderModel';
import {
  Branding as BrandingType,
  PrimaryColor,
  ThemeMode,
} from '../../../graphql-types';
import { brandingForFolderId } from '../../db/picrDb';

export const brandingForFolder = async (
  folder: FolderModel,
): Promise<BrandingType> => {
  let f = folder;
  while (f) {
    const branding = await brandingForFolderId(f.id);
    if (branding) {
      // @ts-ignore unreasonable to expect parent/child folders on this query
      return { ...branding, folder: f };
    } else {
      f = await FolderModel.findByPk(f.parentId);
    }
  }
  return {
    folderId: '',
    id: '0', //urql will complain otherwise
    mode: ThemeMode.Auto,
    primaryColor: PrimaryColor.Blue,
  };
};
