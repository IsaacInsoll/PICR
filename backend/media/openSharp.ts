import type { SharpOptions } from 'sharp';
import sharp from 'sharp';

export type SharpInput = Parameters<typeof sharp>[0];

export const openSharp = (input: SharpInput, options?: SharpOptions) =>
  sharp(input, { unlimited: true, ...options });
