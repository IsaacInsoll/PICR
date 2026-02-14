import sharp, { SharpOptions } from 'sharp';

export const openSharp = (path: string, options?: SharpOptions) =>
  sharp(path, { unlimited: true, ...options });
