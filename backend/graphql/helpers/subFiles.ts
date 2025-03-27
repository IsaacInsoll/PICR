import { FileInterface } from '../../../graphql-types';
import { getFilesForFolder } from '../../db/picrDb';

export const subFilesMap = async (folderId: string | number) => {
  const files = await getFilesForFolder(folderId);

  const obj: { [key: string]: FileInterface } = {};
  files.forEach((f) => {
    obj[f.id] = f;
  });
  return obj;
};
