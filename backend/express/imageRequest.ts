import type { Request, Response } from 'express';
import type { AllSize, ThumbnailSize } from '@shared/thumbnailSize.js';
import { allSizes } from '@shared/thumbnailSize.js';
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
import { db, getServerOptions, type FileFields } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { and, eq } from 'drizzle-orm';
import { thumbnailPath } from '../media/thumbnailPath.js';
import { videoScrubPath } from '../media/videoThumbnailPaths.js';
import { log } from '../logger.js';

type ImageRouteSize = AllSize | 'scrub';

export const imageRequest = async (
  req: Request<{
    id: number;
    size: ImageRouteSize;
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
  if (file.type === 'File') {
    res.sendStatus(404);
    return;
  }
  if (!isImageRouteSize(size)) {
    res.sendStatus(400);
    return;
  }
  // Generated thumbnails/posters can change at the same URL when media settings
  // change and the disk cache is later regenerated. A one-hour TTL avoids repeat
  // gallery views hammering the server, while later conditional requests should
  // usually be cheap 304 responses from sendFile's ETag/Last-Modified handling.
  // Raw originals are content-addressed by fileHash, so they can keep immutable
  // caching without masking regenerated thumbnail bytes.
  res.set(
    'Cache-Control',
    size === 'raw'
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=3600, must-revalidate',
  );
  const extension = extname(filename).toLowerCase(); //extension ignored for original file, only used for thumbs
  if (size === 'scrub') {
    if (file.type !== 'Video') {
      res.sendStatus(404);
      return;
    }
    const fp = videoScrubPath(file);
    const videoStatus = await ensureVideoArtifact(file, 'md', fp, 'scrub');
    if (videoStatus === 'failed') {
      res.sendStatus(500);
      return;
    }
    if (videoStatus === 'missing') {
      res.sendStatus(404);
      return;
    }
    res.sendFile(fp);
    return;
  }

  if (file.type === 'Video' && size !== 'raw') {
    const requestedExtension = extension === '.avif' ? '.avif' : '.jpg';
    const opts = await getServerOptions();
    const posterExtension =
      requestedExtension === '.avif' && !opts.avifEnabled
        ? '.jpg'
        : requestedExtension;
    const posterPath = fullPathFor(file, size, posterExtension);
    const videoStatus = await ensureVideoArtifact(
      file,
      size,
      posterPath,
      'poster',
    );
    if (videoStatus === 'failed') {
      res.sendStatus(500);
      return;
    }
    if (videoStatus === 'missing') {
      res.sendStatus(404);
      return;
    }
    res.sendFile(posterPath);
    return;
  }

  const fp = fullPathFor(file, size, extension);
  if (size !== 'raw' && !existsSync(fp)) {
    if (file.type === 'Image') {
      await generateThumbnail(file, size);
      const opts = await getServerOptions();
      // The below works fine (return JPEG when AVIF requested and doesn't exist, but it feels dodgy)
      if (extension === '.avif' && !opts.avifEnabled) {
        // console.log('⚠️ AVIF not enabled for this server, returning original');
        return res.sendFile(fullPathFor(file, size)); //intentionally excluding extension as server doesn't support AVIF
      }
      const tp = thumbnailPath(
        file,
        size,
        extension === '.avif' ? '.avif' : '.jpg',
      );
      res.sendFile(tp);
      return;
    }
  } else {
    res.sendFile(fullPathFor(file, size, extension));
  }
};

type VideoArtifactStatus = 'ok' | 'failed' | 'missing';

const ensureVideoArtifact = async (
  file: FileFields,
  size: ThumbnailSize,
  path: string,
  artifact: 'poster' | 'scrub',
): Promise<VideoArtifactStatus> => {
  try {
    if (!existsSync(path)) await generateVideoThumbnail(file, size);
    await awaitVideoThumbnailGeneration(file, size);
  } catch (error) {
    log(
      'error',
      `Failed generating video ${artifact} for ${file.name}: ${String(error)}`,
    );
    return 'failed';
  }

  if (existsSync(path)) return 'ok';
  log(
    'error',
    `Video ${artifact} generation completed but cache file is missing for ${file.name}: ${path}`,
  );
  return 'missing';
};

const isImageRouteSize = (size: string): size is ImageRouteSize => {
  return size === 'scrub' || allSizes.includes(size as AllSize);
};
