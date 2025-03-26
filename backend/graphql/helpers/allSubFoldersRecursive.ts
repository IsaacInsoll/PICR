import Folder from '../../models/Folder';
import { Op } from 'sequelize';
import { DBFolderForId } from '../../db/picrDb';
import FolderModel from '../../db/sequelize/FolderModel';

export const allSubFoldersRecursive = async (folderId: number | string) => {
  const f = await DBFolderForId(folderId);
  if (!f.relativePath) {
    //root folder
    return await FolderModel.findAll({ where: { exists: true } });
  }
  return await FolderModel.findAll({
    where: {
      exists: true,
      [Op.or]: [
        { relativePath: { [Op.startsWith]: f.relativePath + '/' } },
        { relativePath: f.relativePath },
      ],
    },
  });
};
