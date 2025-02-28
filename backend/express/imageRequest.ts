import { Request } from 'express';
import { AllSize, allSizes } from '../../frontend/src/helpers/thumbnailSize';
import FileModel from '../db/FileModel';
import { extname } from 'path';
import {
  fullPathFor,
  generateThumbnail,
} from '../media/generateImageThumbnail';
import { existsSync } from 'node:fs';
import {
  awaitVideoThumbnailGeneration,
  generateVideoThumbnail,
} from '../media/generateVideoThumbnail';
import { getServerOptions } from '../db/ServerOptionsModel';

export const imageRequest = async (
  req: Request<{
    id: string;
    size: AllSize;
    hash: string;
    filename?: string;
  }>,
  res,
) => {
  const { id, size, hash, filename } = req.params;
  const file = await FileModel.findOne({
    where: { id, fileHash: hash, exists: true },
  });
  if (!file) res.sendStatus(404);
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
