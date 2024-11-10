import Folder from '../../models/Folder';
import { heroImageForFolder } from './heroImageForFolder';

export const subFolders = async (parentId: string | number) => {
  const folders = await Folder.findAll({
    where: { parentId, exists: true },
    order: [['name', 'ASC']],
  });

  const heroImages = await Promise.all(
    folders.map((f) => heroImageForFolder(f)),
  );

  return folders.map((f, index) => {
    return { ...f.toJSON(), heroImage: heroImages[index] };
  });
};
