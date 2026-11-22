import { extname } from 'node:path';
import { FileType } from '@shared/gql/graphql.js';
import {
  isHeicFormat,
  isJxlFormat,
  isPsbFormat,
  isPsdFormat,
  isRawFormat,
  isSharpReadableFormat,
} from '@shared/imageFormats.js';
import { picrConfig } from '../config/picrConfig.js';

// Keep watcher ingestion and scan reclassification on the same capability rules.
export const fileTypeFor = (filePath: string): FileType | null => {
  const ext = extname(filePath).toLowerCase();
  if (ext === '') return null;
  if (isSharpReadableFormat(filePath)) return FileType.Image;
  if (isRawFormat(filePath) && picrConfig.mediaCaps.raw) return FileType.Image;
  if (isPsdFormat(filePath) && picrConfig.mediaCaps.psd) return FileType.Image;
  if (isPsbFormat(filePath) && picrConfig.mediaCaps.psb) return FileType.Image;
  if (isHeicFormat(filePath) && picrConfig.mediaCaps.heic)
    return FileType.Image;
  if (isJxlFormat(filePath) && picrConfig.mediaCaps.jxl) return FileType.Image;
  if (videoExtensions.includes(ext)) return FileType.Video;
  //TODO: null for ignored files (EG: dot files?)
  //TODO: documents (eg notes in word format?)

  return FileType.File;
};

const videoExtensions = [
  '.mp4',
  '.mov',
  '.avi',
  '.wmv',
  '.webm',
  '.flv',
  '.mkv',
  '.qt',
  '.m4v',
];
