import FolderModel from '../../db/FolderModel';
import {
  Branding as BrandingType,
  PrimaryColor,
  ThemeMode,
} from '../../../graphql-types';
import BrandingModel, { brandingForFolderId } from '../../db/BrandingModel';

export const brandingForFolder = async (
  folder: FolderModel,
): Promise<BrandingType> => {
  let f = folder;
  while (f) {
    const branding = await brandingForFolderId(f.id);
    if (branding) {
      // @ts-ignore unreasonable to expect parent/child folders on this query
      return { ...branding.toJSON(), folder: f };
    } else {
      f = await FolderModel.findByPk(f.parentId);
    }
  }
  return {
    folderId: '',
    id: '',
    mode: ThemeMode.Auto,
    primaryColor: PrimaryColor.Blue,
  };
};
