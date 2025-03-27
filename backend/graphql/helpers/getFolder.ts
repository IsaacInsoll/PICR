import { dbFolderForId } from '../../db/picrDb';

export const getFolder = async (id: string | number) => {
  return await dbFolderForId(id);
};
