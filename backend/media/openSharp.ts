import type { SharpOptions } from 'sharp';
import sharp from 'sharp';

export const openSharp = (path: string, options?: SharpOptions) =>
  sharp(path, { unlimited: true, ...options });
