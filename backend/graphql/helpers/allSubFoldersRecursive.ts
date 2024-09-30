import Folder from '../../models/Folder';
import { Op } from 'sequelize';

export const allSubFoldersRecursive = async (folderId: number | string) => {
  const f = await Folder.findByPk(folderId);
  if (!f.relativePath) {
    //root folder
    return await Folder.findAll({ where: { exists: true } });
  }
  return await Folder.findAll({
    where: {
      relativePath: { [Op.startsWith]: f.relativePath },
      exists: true,
    },
  });
};
