import { Request, Response } from 'express';
import { AllSize, allSizes } from '../../frontend/src/helpers/thumbnailSize.js';
import { extname } from 'path';
import {
  fullPathFor,
  generateThumbnail,
} from '../media/generateImageThumbnail.js';
import { existsSync } from 'node:fs';
import {
  awaitVideoThumbnailGeneration,
  generateVideoThumbnail,
} from '../media/generateVideoThumbnail.js';
import { db, getServerOptions } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { and, eq } from 'drizzle-orm';
import { thumbnailPath } from '../media/thumbnailPath.js';

export const imageRequest = async (
  req: Request<{
    id: number;
    size: AllSize;
    hash: string;
    filename: string;
  }>,
  res: Response,
) => {
  const { id, size, hash, filename } = req.params;
  const file = await db.query.dbFile.findFirst({
    where: and(
      eq(dbFile.id, id),
      eq(dbFile.fileHash, hash),
      eq(dbFile.exists, true),
    ),
  });
  if (!file) {
    res.sendStatus(404);
    return;
  }
  if (file.type == 'File') res.sendStatus(404);
  if (!allSizes.includes(size)) res.sendStatus(400);
  const extension = extname(filename).toLowerCase(); //extension ignored for original file, only used for thumbs
  const fp = fullPathFor(file, size, extension);
  if (size != 'raw' && !existsSync(fp)) {
    if (file.type == 'Image') {
      await generateThumbnail(file, size);
      const opts = await getServerOptions();
      // The below works fine (return JPEG when AVIF requested and doesn't exist, but it feels dodgy)
      if (extension == '.avif' && !opts.avifEnabled) {
        // console.log('⚠️ AVIF not enabled for this server, returning original');
        return res.sendFile(fullPathFor(file, size)); //intentionally excluding extension as server doesn't support AVIF
      }
      const tp = thumbnailPath(
        file,
        size,
        extension == '.avif' ? '.avif' : '.jpg',
      );
      res.sendFile(tp);
      return;
    }
    if (file.type == 'Video') {
      await generateVideoThumbnail(file, size);
    }
  }
  if (file.type == 'Video' && size != 'raw') {
    const p = fullPathFor(file, size) + '/' + filename;
    // it's possible that we have started thumbnail generation for this video but haven't finished it, so extra waits
    await awaitVideoThumbnailGeneration(file, size);
    res.sendFile(p);
  } else {
    res.sendFile(fullPathFor(file, size, extension));
  }
};
