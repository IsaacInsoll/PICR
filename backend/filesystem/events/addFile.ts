import { basename, dirname, extname } from 'path';
import { directoryPath, folderList, relativePath } from '../fileManager';
import File from '../../models/File';
import { logger } from '../../logger';
import { fastHash } from '../fileHash';
import fs from 'fs';
import { FileType } from '../../../graphql-types';
import { getImageRatio } from '../../media/getImageRatio';
import { getImageMetadata } from '../../media/getImageMetadata';
import { getVideoMetadata } from '../../media/getVideoMetadata';
import { generateAllThumbs } from '../../media/generateImageThumbnail';
import { blurHashFile, encodeImageToBlurhash } from '../../media/blurHash';

export const addFile = async (filePath: string, generateThumbs: boolean) => {
  const type = validExtension(filePath);
  if (!type) {
    logger(`🤷‍♂️ Ignoring ${filePath} as it's not a supported file format`);
    return;
  }
  // console.log(`${basename(filePath)} of type ${type} in ${dirname(filePath)}`);
  const folderId = await findFolderId(dirname(filePath));

  const stats = fs.statSync(filePath);

  const props = {
    name: basename(filePath),
    folderId: folderId,
    relativePath: relativePath(dirname(filePath)),
  };
  // console.log(props);
  const [file, created] = await File.findOrCreate({
    where: props,
    defaults: {
      type: type,
      fileSize: stats.size,
      fileLastModified: stats.mtime,
      exists: true,
    },
  });
  const modified =
    !created && file.fileLastModified.getTime() != stats.mtime.getTime();
  if (modified) {
    console.log([file.fileLastModified, 'not', stats.mtime]);
  }
  if (
    created ||
    !file.fileHash ||
    modified ||
    (file.type == 'Image' && !file.blurHash) //TODO: remove this condition once everybody has 'upgraded' to blurhashes
  ) {
    logger(
      (created
        ? 'New File: '
        : modified
          ? 'Modified: '
          : 'Hash Mismatch for: ') + filePath,
    );
    // const hash = await fileHash2(filePath);
    file.fileHash = fastHash(file, stats);

    if (type == 'Image') {
      // deleteAllThumbs(filePath);
      file.imageRatio = await getImageRatio(filePath);
      const meta = await getImageMetadata(file);
      file.metadata = JSON.stringify(meta);
      file.blurHash = await encodeImageToBlurhash(filePath);
      if (generateThumbs) generateAllThumbs(file); // will skip if thumbs exist
    }
    if (type == 'Video') {
      const meta = await getVideoMetadata(file);
      file.metadata = JSON.stringify(meta);
      file.duration = meta.Duration;
      file.imageRatio = meta.Height > 0 ? meta.Width / meta.Height : 0;
    }
  }
  file.exists = true;
  file.save();
  // console.log(file);
  logger('➕ [done]' + filePath);
};

const findFolderId = async (fullPath: string) => {
  while (true) {
    if (fullPath == directoryPath) return 1;
    const id = folderList[relativePath(fullPath)];
    if (id && id !== '0') return id;
    logger('💤 Sleeping waiting for a FolderID for a file in ' + fullPath);
    await new Promise((r) => setTimeout(r, 500));
  }
};

const validExtension = (filePath: string): FileType | null => {
  const ext = extname(filePath).toLowerCase();
  if (ext === '') return null;
  if (imageExtensions.includes(ext)) return FileType.Image;
  if (videoExtensions.includes(ext)) return FileType.Video;
  //TODO: null for ignored files (EG: dot files?)
  //TODO: documents (eg notes in word format?)

  return FileType.File;
};

const imageExtensions = ['.png', '.jpeg', '.jpg', '.gif'];
const videoExtensions = [
  '.mp4',
  '.mov',
  '.avi',
  '.wmv',
  '.webm',
  '.flv',
  '.mkv',
  '.qt',
  '.m4v',
];
