export const sharpReadableExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.tiff',
  '.tif',
  '.svg',
] as const;

export const browserDisplayableOriginalExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
] as const;

export const rawExtensions = [
  '.cr2',
  '.cr3',
  '.nef',
  '.nrw',
  '.arw',
  '.sr2',
  '.srf',
  '.dng',
  '.raf',
  '.orf',
  '.rw2',
  '.pef',
  '.srw',
  '.x3f',
  '.3fr',
  '.erf',
  '.kdc',
  '.dcr',
  '.mrw',
  '.raw',
] as const;

export const magickDecodeExtensions = [
  '.psd',
  '.psb',
  '.heic',
  '.heif',
] as const;

const extensionFor = (name: string): string => {
  const baseName = name.split(/[\\/]/).pop() ?? name;
  const dotIndex = baseName.lastIndexOf('.');
  return dotIndex > 0 ? baseName.slice(dotIndex).toLowerCase() : '';
};

const includesExtension = (
  extensions: readonly string[],
  name: string,
): boolean => extensions.includes(extensionFor(name));

export const isBrowserDisplayableOriginal = (name: string): boolean =>
  includesExtension(browserDisplayableOriginalExtensions, name);

export const isDecodableImageFormat = (name: string): boolean =>
  includesExtension(rawExtensions, name) ||
  includesExtension(magickDecodeExtensions, name);

export const isSharpReadableFormat = (name: string): boolean =>
  includesExtension(sharpReadableExtensions, name);

export const isRawFormat = (name: string): boolean =>
  includesExtension(rawExtensions, name);

export const isPsdFormat = (name: string): boolean =>
  extensionFor(name) === '.psd';

export const isPsbFormat = (name: string): boolean =>
  extensionFor(name) === '.psb';

export const isHeicFormat = (name: string): boolean =>
  ['.heic', '.heif'].includes(extensionFor(name));
