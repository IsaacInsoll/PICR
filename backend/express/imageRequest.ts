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
  const file = await FileModel.findOne({ where: { id, fileHash: hash } });
  if (!file) res.sendStatus(404);
  if (file.type == 'File') res.sendStatus(404);
  if (!allSizes.includes(size)) res.sendStatus(400);
  const extension = extname(filename).toLowerCase(); //extension ignored for original file, only used for thumbs
  const fp = fullPathFor(file, size, extension);
  if (size != 'raw' && !existsSync(fp)) {
    if (file.type == 'Image') await generateThumbnail(file, size);
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
