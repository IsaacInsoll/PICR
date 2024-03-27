import { basename, dirname, extname } from 'path';
import { folderList, relativePath } from '../fileManager';
import { addFolder } from './addFolder';
import File from '../../models/File';
import { logger } from '../../logger';
import { fileHash } from '../fileHash';
import {
  deleteAllThumbs,
  generateAllThumbs,
  getImageMetadata,
  getImageRatio,
} from '../../helpers/thumbnailGenerator';
import fs from 'fs';
import { FileType } from '../../../graphql-types';

export const addFile = async (filePath: string) => {
  const type = validExtension(filePath);
  if (!type) {
    logger(`🤷‍♂️ Ignoring ${filePath} as it's not a supported file format`);
    return;
  }
  // console.log(`${basename(filePath)} of type ${type} in ${dirname(filePath)}`);
  const folderId = await findFolderId(dirname(filePath));

  const size = fs.statSync(filePath).size;

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
    defaults: { fileHash: hash, type: type, fileSize: size },
  });
  if (file.fileHash !== hash || created) {
    logger((created ? 'New File: ' : 'Hash Mismatch for: ') + filePath, false);
    if (type == 'Image') {
      deleteAllThumbs(filePath);
      file.fileHash = hash;
      file.imageRatio = await getImageRatio(filePath);
      const meta = await getImageMetadata(filePath);
      file.metadata = JSON.stringify(meta);
      file.save();
      generateAllThumbs(filePath); // will skip if thumbs exist
    }
  }
  // console.log(file);
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

const validExtension = (filePath: string): FileType | null => {
  const ext = extname(filePath);
  if (ext === '') return null;
  if (imageExtensions.includes(ext)) return FileType.Image;
  //TODO: video files?
  //TODO: null for ignored files (EG: dot files?)
  //TODO: documents (eg notes in word format?)

  return FileType.File;
};

const imageExtensions = ['.png', '.jpeg', '.jpg', '.gif'];
