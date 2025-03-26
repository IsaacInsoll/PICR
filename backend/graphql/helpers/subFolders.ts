import FolderModel from '../../db/FolderModel';

export const subFolders = async (parentId: string | number) => {
  const folders = await FolderModel.findAll({
    where: { parentId, exists: true },
    order: [['name', 'ASC']],
  });

  return folders.map((f) => {
    return { ...f.toJSON() };
  });
};
