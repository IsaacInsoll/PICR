import { extname, join } from 'path';
import { picrConfig } from '../config/picrConfig.js';
import { FileType } from '@shared/gql/graphql.js';
import { thumbnailSizes } from '@shared/thumbnailSize.js';

export interface ThumbnailVariant {
  /** Absolute path to the cache entry. */
  path: string;
  /** Video montage variants are directories; image thumbnails are files. */
  isDirectory: boolean;
}

/**
 * Every cache entry that *could* exist for a file at the given
 * (`relativePath`, `name`, `hash`). Callers treat absent entries as no-ops —
 * many variants are legitimately never generated (AVIF may be disabled, the
 * decoded intermediate only exists for RAW/PSD/HEIC, thumbnails are lazy so not
 * every size exists, video only has the `md` montage). Mirrors the paths built
 * by `thumbnailPath.ts` and `decodedImagePath.ts`, but keyed off primitives so
 * both the runtime (a `dbFile` row) and the migration (a DB record) can use it.
 *
 * The variant order is deterministic, so two calls that differ only in
 * `relativePath`/`name` line up positionally (used by `moveThumbnailFile`).
 */
export const thumbnailVariantPaths = (
  relativePath: string,
  name: string,
  hash: string,
  type: FileType | null,
): ThumbnailVariant[] => {
  const dir = join(picrConfig.cachePath, 'thumbs', relativePath);
  const variants: ThumbnailVariant[] = [];

  if (type === FileType.Image) {
    // Image thumbnails are always written as .jpg, plus .avif when enabled.
    for (const size of thumbnailSizes) {
      variants.push({
        path: join(dir, `${name}-${size}-${hash}.jpg`),
        isDirectory: false,
      });
      variants.push({
        path: join(dir, `${name}-${size}-${hash}.avif`),
        isDirectory: false,
      });
    }
    // Decoded intermediate for RAW/PSD/HEIC (absent for sharp-native formats).
    variants.push({
      path: join(dir, `${name}-decoded-${hash}.jpg`),
      isDirectory: false,
    });
  } else if (type === FileType.Video) {
    // A single montage directory for the `md` size, named with the original
    // video extension (see generateVideoThumbnail.ts).
    variants.push({
      path: join(dir, `${name}-md-${hash}${extname(name)}`),
      isDirectory: true,
    });
  }
  // FileType.File has no thumbnails.

  return variants;
};
