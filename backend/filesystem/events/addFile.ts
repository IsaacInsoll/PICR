import { basename, dirname, extname } from 'path';
import { folderList, relativePath } from '../fileManager.js';
import { log } from '../../logger.js';
import { fastHash } from '../fileHash.js';
import fs from 'fs';
import { FileType } from '../../../graphql-types.js';
import { getImageRatio } from '../../media/getImageRatio.js';
import { getImageMetadata } from '../../media/getImageMetadata.js';
import { getVideoMetadata } from '../../media/getVideoMetadata.js';
import { generateAllThumbs } from '../../media/generateImageThumbnail.js';
import { encodeImageToBlurhash } from '../../media/blurHash.js';
import { picrConfig } from '../../config/picrConfig.js';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/picrDb.js';
import { dbFile } from '../../db/models/index.js';
import { statSync } from 'node:fs';

export const addFile = async (filePath: string, generateThumbs: boolean) => {
  const type = validExtension(filePath);
  if (!type) {
    log('info', `🤷‍♂️ Ignoring ${filePath} as it's not a supported file format`);
    return;
  }
  //todo: if generateThumbs then maybe we need to update folder last modified?

  // console.log(`${basename(filePath)} of type ${type} in ${dirname(filePath)}`);
  const folderId = await findFolderId(dirname(filePath));

  const stats = statSync(filePath);

  const props = {
    name: basename(filePath),
    folderId: folderId,
    relativePath: relativePath(dirname(filePath)),
  };

  let file = await db.query.dbFile.findFirst({
    where: and(
      eq(dbFile.name, props.name),
      eq(dbFile.folderId, props.folderId),
      eq(dbFile.relativePath, props.relativePath),
    ),
  });

  const created = !file;

  if (created) {
    file = await db
      .insert(dbFile)
      .values({
        ...props,
        type: type,
        fileSize: stats.size,
        fileLastModified: stats.mtime,
        exists: false, //set as `true` once we have all the hash/metadata
        totalComments: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        fileHash: '',
        rating: 0,
      })
      .returning()
      .then((f) => f[0]);
  }

  if (!file) return; // not needed, just for typescript to know it's not null at this point

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
      file.duration = meta.Duration ?? null;
      file.imageRatio =
        meta.Height && meta.Width && meta.Height > 0
          ? meta.Width / meta.Height
          : 0;
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
  await db
    .update(dbFile)
    .set({ ...file, updatedAt: new Date() })
    .where(eq(dbFile.id, file.id));
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
    if (id && id !== 0) return id;
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
