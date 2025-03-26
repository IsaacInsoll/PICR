import { basename, dirname, extname } from 'path';
import { folderList, relativePath } from '../fileManager';
import FileModel from '../../db/FileModel';
import { log } from '../../logger';
import { fastHash } from '../fileHash';
import fs from 'fs';
import { FileType } from '../../../graphql-types';
import { getImageRatio } from '../../media/getImageRatio';
import { getImageMetadata } from '../../media/getImageMetadata';
import { getVideoMetadata } from '../../media/getVideoMetadata';
import { generateAllThumbs } from '../../media/generateImageThumbnail';
import { encodeImageToBlurhash } from '../../media/blurHash';
import { picrConfig } from '../../config/picrConfig';

export const addFile = async (filePath: string, generateThumbs: boolean) => {
  const type = validExtension(filePath);
  if (!type) {
    log('info', `🤷‍♂️ Ignoring ${filePath} as it's not a supported file format`);
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
  const [file, created] = await FileModel.findOrCreate({
    where: props,
    defaults: {
      type: type,
      fileSize: stats.size,
      fileLastModified: stats.mtime,
      exists: false, //set as `true` once we have all the hash/metadata
      totalComments: 0,
    },
  });
  const modified =
    !created && file.fileLastModified.getTime() != stats.mtime.getTime();
  if (created || !file.fileHash || modified) {
    log(
      'info',
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
      if (generateThumbs) await generateAllThumbs(file); // will skip if thumbs exist
    }
    if (type == 'Video') {
      const meta = await getVideoMetadata(file);
      file.metadata = JSON.stringify(meta);
      file.duration = meta.Duration;
      file.imageRatio = meta.Height > 0 ? meta.Width / meta.Height : 0;
    }
  } else if (picrConfig.updateMetadata) {
    log('info', '🔄️ update metadata: ' + file.id);
    switch (type) {
      case 'Image':
        file.metadata = JSON.stringify(await getImageMetadata(file));
        break;
      case 'Video':
        file.metadata = JSON.stringify(await getVideoMetadata(file));
        break;
      default:
        break;
    }
  }
  file.exists = true;
  await file.save();
  // console.log(file);
  log(
    'info',
    '➕ [done] ' + (generateThumbs ? '[generateThumbs] ' : '') + filePath,
  );
};

const findFolderId = async (fullPath: string) => {
  while (true) {
    if (fullPath == picrConfig.mediaPath) return 1;
    const id = folderList[relativePath(fullPath)];
    if (id && id !== '0') return id;
    log('info', '💤 Sleeping waiting for a FolderID for a file in ' + fullPath);
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
