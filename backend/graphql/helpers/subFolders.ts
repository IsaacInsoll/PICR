import Folder from '../../models/Folder';

export const subFolders = async (parentId: string | number) => {
  const folders = await Folder.findAll({
    where: { parentId, exists: true },
    order: [['name', 'ASC']],
  });
  return folders.map((f) => f.toJSON());
};
