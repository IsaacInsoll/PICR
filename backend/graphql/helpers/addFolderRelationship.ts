import Folder from '../../models/Folder';

type FolderRelationship = { folderId: string }[];

// Takes a list of objects with `folderId` relationship and adds the folder details to each object
export const addFolderRelationship = async (
  list: FolderRelationship,
): Promise<FolderRelationship> => {
  const ids = list
    .map((b) => b.folderId)
    .filter((v, i, a) => a.indexOf(v) === i);

  if (ids.length == 0) return list;

  const folders = await Folder.findAll({ where: { id: ids } });
  return list.map((obj) => {
    const folder = folders.find((f) => f.id == obj.folderId)?.toJSON();
    return { ...obj, folder };
  });
};
