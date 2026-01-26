import { basename, dirname, extname } from 'path';
import { addFolder } from './addFolder.js';
import { folderList, relativePath } from '../fileManager.js';
import { log } from '../../logger.js';
import { fastHash } from '../fileHash.js';
import { FileType } from '../../../graphql-types.js';
import { getImageRatio } from '../../media/getImageRatio.js';
import { getImageMetadata } from '../../media/getImageMetadata.js';
import { getVideoMetadata } from '../../media/getVideoMetadata.js';
import { generateAllThumbs } from '../../media/generateImageThumbnail.js';
import { encodeImageToBlurhash } from '../../media/blurHash.js';
import { picrConfig } from '../../config/picrConfig.js';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/picrDb.js';
import { dbFile, dbFolder } from '../../db/models/index.js';
import { delay } from '../../helpers/delay.js';
import { existsSync, Stats, statSync } from 'node:fs';

export const addFile = async (
  filePath: string,
  generateThumbs: boolean,
  statsProp?: Stats,
  renameFromPath?: string,
) => {
  const type = validExtension(filePath);
  if (!type) {
    log('info', `🤷‍♂️ Ignoring ${filePath} as it's not a supported file format`);
    return;
  }
  //todo: if generateThumbs then maybe we need to update folder last modified?

  // console.log(`${basename(filePath)} of type ${type} in ${dirname(filePath)}`);
  const folderId = await findFolderId(dirname(filePath));

  const stats = statsProp ?? statSync(filePath);

  const props = {
    name: basename(filePath),
    folderId: folderId,
    relativePath: relativePath(dirname(filePath)),
  };

  let wasRenamed = false;
  let file = renameFromPath
    ? await db.query.dbFile.findFirst({
        where: and(
          eq(dbFile.name, basename(renameFromPath)),
          eq(dbFile.relativePath, relativePath(dirname(renameFromPath))),
        ),
      })
    : undefined;

  if (file) {
    wasRenamed = true;
    file.name = props.name;
    file.relativePath = props.relativePath;
    file.folderId = props.folderId;
    file.type = type;
    file.fileSize = stats.size;
    file.fileCreated = stats.birthtime;
    file.fileLastModified = stats.mtime;
  } else {
    file = await db.query.dbFile.findFirst({
      where: and(
        eq(dbFile.name, props.name),
        eq(dbFile.folderId, props.folderId),
        eq(dbFile.relativePath, props.relativePath),
      ),
    });
  }

  const created = !file;

  if (created) {
    file = await db
      .insert(dbFile)
      .values({
        ...props,
        type: type,
        fileSize: stats.size,
        fileCreated: stats.birthtime,
        fileLastModified: stats.mtime,
        exists: false, //set as `true` once we have all the hash/metadata
        existsRescan: false,
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

  const previousLastModified = created ? null : file.fileLastModified;
  const previousCreated = created ? null : file.fileCreated;
  const modified =
    !created &&
    (previousLastModified!.getTime() != stats.mtime.getTime() ||
      previousCreated!.getTime() != stats.birthtime.getTime() ||
      wasRenamed);

  if (created || !file.fileHash || modified) {
    log(
      'info',
      (created
        ? 'New File: '
        : wasRenamed
          ? 'Renamed: '
          : modified
            ? 'Modified: '
            : 'Hash Mismatch for: ') + filePath,
    );
    // const hash = await fileHash2(filePath);
    file.fileHash = fastHash(file, stats);
    file.fileCreated = stats.birthtime;
    file.fileLastModified = stats.mtime;

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
  file.existsRescan = true;
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
  if (fullPath === picrConfig.mediaPath) return 1;

  const relative = relativePath(fullPath);

  for (let attempt = 0; attempt < 6; attempt++) {
    const cached = folderList[relative];
    if (cached && cached !== 0) return cached;

    const dbFolderMatch = await db.query.dbFolder.findFirst({
      columns: { id: true },
      where: eq(dbFolder.relativePath, relative),
    });
    if (dbFolderMatch) {
      folderList[relative] = dbFolderMatch.id;
      return dbFolderMatch.id;
    }

    if (existsSync(fullPath)) {
      const folderId = await addFolder(fullPath);
      if (folderId) return folderId;
    }

    await delay(200);
  }

  throw new Error(`Unable to resolve folderId for ${relative}`);
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

// sharp uses libvips but different builds support different formats (some do PSD / heif / avif!)
// this is 'bare minimum
// Call console.log(sharp.format) to see exactly what is supported

const imageExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.tiff',
  '.tif',
  '.svg',
  // '.avif',
  // '.heic',
  // '.heif',
  // '.psd',
];

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
