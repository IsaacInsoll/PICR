import { basename, dirname, extname } from 'path';
import { folderList, relativePath } from '../fileManager';
import { addFolder } from './addFolder';
import File from '../../models/File';
import { logger } from '../../logger';
import { fileHash } from '../fileHash';
import {
  deleteAllThumbs,
  generateAllThumbs,
  getImageRatio,
} from '../../helpers/thumbnailGenerator';

export const addFile = async (filePath: string) => {
  const type = validExtension(filePath);
  if (!type) {
    logger(`🤷‍♂️ Ignoring ${filePath} as it's not a supported file format`);
    return;
  }
  // console.log(`${basename(filePath)} of type ${type} in ${dirname(filePath)}`);
  const folderId = await findFolderId(dirname(filePath));
  if (!folderId) console.log(`Matching folder is ${folderId}`);

  const hash = fileHash(filePath);
  // console.log(hash);

  const props = {
    name: basename(filePath),
    folderId: folderId,
    relativePath: relativePath(dirname(filePath)),
  };
  // console.log(props);
  const [file, created] = await File.findOrCreate({
    where: props,
    defaults: { fileHash: hash },
  });
  if (file.fileHash !== hash || created) {
    console.log((created ? 'New File: ' : 'Hash Mismatch for: ') + filePath);
    deleteAllThumbs(filePath);
    file.fileHash = hash;
    file.imageRatio = await getImageRatio(filePath);
    file.save();
  }
  // console.log(file);
  generateAllThumbs(filePath); // will skip if thumbs exist
  logger('➕ ' + filePath);
};

const findFolderId = async (fullPath: string) => {
  let id = folderList[relativePath(fullPath)];
  if (!id) {
    const f = await addFolder(fullPath);
    id = f.id;
  }
  return id;
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
