import Folder from '../../models/Folder';
import { subFiles } from './subFiles';

import { subFolders } from './subFolders';
import { heroImageForFolder } from './heroImageForFolder';

export const getFolder = async (id: string | number) => {
  const folder = await Folder.findByPk(id);
  const data = folder.toJSON();
  data.heroImage = await heroImageForFolder(folder);
  data.subFolders = await subFolders(id);
  data.files = await subFiles(id);
  // data.publicLinks = await publicLinks(id);
  return data;
};
