import FolderModel from '../db/FolderModel';
import { Op } from 'sequelize';

export const allSubFoldersRecursive = async (folderId: number | string) => {
  const f = await FolderModel.findByPk(folderId);
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
