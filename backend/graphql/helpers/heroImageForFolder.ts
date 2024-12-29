import Folder from '../../models/Folder';
import File from '../../models/File';
import { Op } from 'sequelize';
import { allSubFoldersRecursive } from '../../helpers/allSubFoldersRecursive';

export const heroImageForFolder = async (f: Folder) => {
  // 1. Hero Image set for current folder
  const heroImage =
    f.heroImageId != 0 ? await File.findByPk(f.heroImageId) : undefined;
  if (heroImage && heroImage.exists && heroImage.folderId == f.id) {
    return heroImage;
  }

  // 2. First image in this folder
  const first = await File.findOne({
    where: { folderId: f.id, type: 'Image', exists: true },
    order: [['name', 'ASC']],
  });
  if (first) return first;

  // 3. Hero image in subfolder
  const subFolder = await heroImageForSubFolder(f.id);
  if (subFolder) return subFolder;

  // 4. First image in any subfolder
  const allSubFolders = await allSubFoldersRecursive(f.id);
  const subFolderIds = allSubFolders.map((f) => f.id);
  const s = await heroImageForSubFolder(subFolderIds);
  if (s) return s;

  const allImages = await File.findOne({
    where: {
      folderId: subFolderIds,
      type: 'Image',
      exists: true,
    },
    order: [['name', 'ASC']],
  });
  return allImages;
};

const heroImageForSubFolder = async (parentIds: string[]) => {
  const subFolder = await Folder.findOne({
    where: { parentId: parentIds, exists: true, [Op.not]: { heroImageId: 0 } },
    order: [['name', 'ASC']],
  });

  const subHeroImage = subFolder
    ? await File.findByPk(subFolder.heroImageId)
    : undefined;
  if (
    subHeroImage &&
    subHeroImage.exists &&
    subHeroImage.folderId == subFolder.id
  ) {
    return subHeroImage;
  }
};
