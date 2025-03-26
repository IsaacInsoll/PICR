import { subFiles } from './subFiles';

import { subFolders } from './subFolders';
import { heroImageForFolder } from './heroImageForFolder';
import { DBFolderForId } from '../../db/picrDb';

export const getFolder = async (id: string | number) => {
  const folder = await DBFolderForId(id);
  const data = { ...folder };
  data.heroImage = await heroImageForFolder(folder);
  data.subFolders = await subFolders(id);
  data.files = await subFiles(id);
  // data.publicLinks = await publicLinks(id);
  return data;
};
