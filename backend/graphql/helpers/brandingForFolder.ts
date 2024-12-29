import Folder from '../../models/Folder';
import {
  Branding as BrandingType,
  PrimaryColor,
  ThemeMode,
} from '../../../graphql-types';
import Branding from '../../models/Branding';

export const brandingForFolder = async (
  folder: Folder,
): Promise<BrandingType> => {
  let f = folder;
  while (f) {
    const branding = await Branding.findOne({ where: { folderId: f.id } });
    if (branding) {
      // @ts-ignore unreasonable to expect parent/child folders on this query
      return { ...branding.toJSON(), folder: f };
    } else {
      f = await Folder.findByPk(f.parentId);
    }
  }
  return {
    folderId: '',
    id: '',
    mode: ThemeMode.Auto,
    primaryColor: PrimaryColor.Blue,
  };
};
