import type { Request, Response } from 'express';
import type { AllSize, ThumbnailSize } from '@shared/thumbnailSize.js';
import { allSizes } from '@shared/thumbnailSize.js';
import { extname } from 'path';
import {
  fullPathFor,
  generateThumbnailVariant,
} from '../media/generateImageThumbnail.js';
import { existsSync } from 'node:fs';
import {
  awaitVideoThumbnailGeneration,
  generateVideoThumbnail,
  generateVideoThumbnailVariant,
} from '../media/generateVideoThumbnail.js';
import { db, type FileFields } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { and, eq } from 'drizzle-orm';
import { thumbnailPath, thumbnailVariantPath } from '../media/thumbnailPath.js';
import {
  videoPosterVariantPath,
  videoScrubPath,
} from '../media/videoThumbnailPaths.js';
import { log } from '../logger.js';
import {
  thumbnailVariantFormats,
  thumbnailVariantQualityForSettings,
  thumbnailVariantForToken,
  thumbnailVariantForWidth,
  type ThumbnailVariant,
  type ThumbnailVariantWidth,
} from '@shared/thumbnailVariants.js';
import { getServerMediaSettings } from '../media/serverMediaSettings.js';

type ResolvedImageRouteSize =
  | { kind: 'raw'; size: 'raw' }
  | { kind: 'scrub'; size: 'scrub' }
  | { kind: 'legacy'; size: ThumbnailSize }
  | { kind: 'variant'; variant: ThumbnailVariant };

const warnedLegacyThumbnailSizes = new Set<ThumbnailSize>();

export const imageRequest = async (
  req: Request<{
    id: number;
    size: string;
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
  const routeSize = resolveImageRouteSize(size);
  if (!routeSize) {
    res.sendStatus(400);
    return;
  }
  const extension = extname(filename).toLowerCase(); //extension ignored for original file, only used for thumbs
  if (routeSize.kind === 'legacy' && extension === '.avif') {
    res.sendStatus(404);
    return;
  }
  if (routeSize.kind === 'scrub') {
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
    sendCachedFile(res, fp, routeSize.kind);
    return;
  }

  if (routeSize.kind === 'variant') {
    const fp =
      file.type === 'Video'
        ? videoPosterVariantPath(file, routeSize.variant)
        : thumbnailVariantPath(file, routeSize.variant);
    if (!existsSync(fp)) {
      const settings = await getServerMediaSettings();
      const currentQuality =
        thumbnailVariantQualityForSettings(
          thumbnailVariantFormats[routeSize.variant.format],
          settings,
        ) === routeSize.variant.quality;
      if (!currentQuality) {
        res.sendStatus(404);
        return;
      }

      if (file.type === 'Video') {
        const videoStatus = await ensureVideoVariantArtifact(
          file,
          routeSize.variant,
          fp,
        );
        if (videoStatus === 'failed') {
          res.sendStatus(500);
          return;
        }
        if (videoStatus === 'missing') {
          res.sendStatus(404);
          return;
        }
      } else {
        await generateThumbnailVariant(file, routeSize.variant);
        if (!existsSync(fp)) {
          res.sendStatus(500);
          return;
        }
      }
    }

    sendCachedFile(res, fp, routeSize.kind);
    return;
  }

  if (routeSize.kind === 'legacy') {
    warnLegacyThumbnailRoute(routeSize.size);
    const legacyPath =
      file.type === 'Video'
        ? fullPathFor(file, routeSize.size)
        : thumbnailPath(file, routeSize.size);
    if (existsSync(legacyPath)) {
      sendCachedFile(res, legacyPath, routeSize.kind);
      return;
    }

    const variant = await currentVariantForLegacySize(routeSize.size);
    const variantPath =
      file.type === 'Video'
        ? videoPosterVariantPath(file, variant)
        : thumbnailVariantPath(file, variant);
    if (file.type === 'Video') {
      const videoStatus = await ensureVideoVariantArtifact(
        file,
        variant,
        variantPath,
      );
      if (videoStatus === 'failed') {
        res.sendStatus(500);
        return;
      }
      if (videoStatus === 'missing') {
        res.sendStatus(404);
        return;
      }
    } else if (!existsSync(variantPath)) {
      await generateThumbnailVariant(file, variant);
      if (!existsSync(variantPath)) {
        res.sendStatus(500);
        return;
      }
    }
    sendCachedFile(res, variantPath, routeSize.kind);
    return;
  }

  sendCachedFile(res, fullPathFor(file, routeSize.size), 'raw');
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

const ensureVideoVariantArtifact = async (
  file: FileFields,
  variant: ThumbnailVariant,
  path: string,
): Promise<VideoArtifactStatus> => {
  try {
    if (!existsSync(path)) await generateVideoThumbnailVariant(file, variant);
  } catch (error) {
    log(
      'error',
      `Failed generating video poster variant ${variant.token} for ${file.name}: ${String(error)}`,
    );
    return 'failed';
  }

  if (existsSync(path)) return 'ok';
  log(
    'error',
    `Video poster variant generation completed but cache file is missing for ${file.name}: ${path}`,
  );
  return 'missing';
};

const resolveImageRouteSize = (size: string): ResolvedImageRouteSize | null => {
  if (size === 'scrub') return { kind: 'scrub', size };
  if (allSizes.includes(size as AllSize)) {
    if (size === 'raw') return { kind: 'raw', size };
    return { kind: 'legacy', size: size as ThumbnailSize };
  }

  const variant = thumbnailVariantForToken(size);
  if (variant) return { kind: 'variant', variant };
  return null;
};

const legacyVariantWidths = {
  sm: 250,
  md: 500,
  lg: 2560,
} as const satisfies Record<ThumbnailSize, ThumbnailVariantWidth>;

const currentVariantForLegacySize = async (
  size: ThumbnailSize,
): Promise<ThumbnailVariant> => {
  const settings = await getServerMediaSettings();
  return thumbnailVariantForWidth(
    legacyVariantWidths[size],
    settings.thumbnailJpegQuality,
  );
};

const warnLegacyThumbnailRoute = (size: ThumbnailSize): void => {
  if (warnedLegacyThumbnailSizes.has(size)) return;
  warnedLegacyThumbnailSizes.add(size);
  log(
    'warn',
    `Legacy thumbnail route /image/:id/${size}/... was used. PICR 1.x serves it for compatibility, but clients should request thumbnail variant tokens before 2.0 removes legacy thumbnail routes.`,
  );
};

const sendCachedFile = (
  res: Response,
  path: string,
  kind: ResolvedImageRouteSize['kind'],
): void => {
  // Set cache headers only on successful file responses. Error branches must not
  // become sticky in browser/proxy caches, especially for token thumbnails where
  // the success path intentionally has a longer TTL.
  res.set('Cache-Control', cacheControlFor(kind));
  res.sendFile(path);
};

const cacheControlFor = (kind: ResolvedImageRouteSize['kind']): string => {
  if (kind === 'raw') return 'public, max-age=31536000, immutable';
  if (kind === 'variant') return 'public, max-age=86400';
  return 'public, max-age=3600, must-revalidate';
};
