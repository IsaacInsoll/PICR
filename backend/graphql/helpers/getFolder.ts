import { dbFolderForId } from '../../db/picrDb';

export const getFolder = async (id: number) => {
  return await dbFolderForId(id);
};
