import { FileFields, getFilesForFolder } from '../../db/picrDb.js';

export const subFilesMap = async (folderId: number) => {
  const files = await getFilesForFolder(folderId);

  const obj: { [key: string]: FileFields } = {};
  files.forEach((f) => {
    obj[f.id] = f;
  });
  return obj;
};
