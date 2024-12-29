import Folder from '../models/Folder';

// TODO: work out if we need both allSubFoldersRecursive and AllChildFolderIds, they are different implementations of almost the same thing
// This one is slower as it does multiple queries
export const allChildFolderIds = async (
  folder: Folder,
  // context,
): Promise<string[]> => {
  //NOTE: no permissions done here, if you can see parent you can see the children
  let currentIds = [folder.id];
  const all = [folder.id];
  while (currentIds.length > 0) {
    const newlyFound = await Folder.findAll({
      where: { parentId: currentIds, exists: true },
    });
    currentIds = newlyFound.map((item) => item.id);
    if (currentIds.length) {
      all.push(...currentIds);
    }
  }
  return all;
};
