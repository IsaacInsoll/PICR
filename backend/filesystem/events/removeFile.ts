import { basename, dirname, extname } from 'path';
import { folderList, relativePath } from '../fileManager.js';
import { log } from '../../logger.js';
import { FileType } from '../../../graphql-types.js';
import { picrConfig } from '../../config/picrConfig.js';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/picrDb.js';
import { dbFile } from '../../db/models/index.js';

export const removeFile = async (filePath: string) => {
  const folderId = await findFolderId(dirname(filePath));
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

  if (!file) return;

  await db
    .update(dbFile)
    .set({ exists: false, updatedAt: new Date() })
    .where(eq(dbFile.id, file.id));

  // if (file.type == 'Image' || file.type =='Video') {
  //   deleteAllThumbs(filePath);
  // }
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
