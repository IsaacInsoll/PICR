import FolderModel from '../db/FolderModel';
import { Op } from 'sequelize';

//NOTE: no permissions done here, if you can see parent you can see the children
export const allSubfolders = async (folderId: number | string) => {
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
export const allSubfolderIds = async (
  folder: FolderModel,
): Promise<string[]> => {
  const folders = await allSubfolders(folder.id);
  return folders.map((f) => f.id);
};
