import { basename, dirname, extname } from 'path';
import { folderList, relativePath } from '../fileManager';
import { addFolder } from './addFolder';
import { File } from '../../models/file';
import { logger } from '../../logger';

export const addFile = async (filePath: string) => {
  const type = validExtension(filePath);
  if (!type) {
    console.log(`🤷‍♂️ Ignoring ${filePath} as it's not a supported file format`);
    return;
  }
  // console.log(`${basename(filePath)} of type ${type} in ${dirname(filePath)}`);
  const folderId = await findFolderId(dirname(filePath));
  if (!folderId) console.log(`Matching folder is ${folderId}`);

  const props = {
    name: basename(filePath),
    folderId: folderId,
    relativePath: relativePath(dirname(filePath)),
  };
  // console.log(props);
  const [file] = await File.findOrCreate({ where: props });
  // console.log(file);
  logger('➕ ' + filePath);
};

const findFolderId = async (fullPath: string) => {
  const id = folderList[relativePath(fullPath)];
  if (!id) {
    console.warn(`Found image in previously unknown folder: ${fullPath}`);
    return await addFolder(fullPath);
  }
  return folderList[relativePath(fullPath)];
};

const validExtension = (filePath: string): string | null => {
  const ext = extname(filePath);
  if (ext === '') return null;
  if (imageExtensions.includes(ext)) return 'image';
  //TODO: video files?
  //TODO: documents (eg notes in word format?)
  return null;
};

const imageExtensions = ['.png', '.jpeg', '.jpg', '.gif'];
