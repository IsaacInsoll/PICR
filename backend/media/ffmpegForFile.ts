import ffmpeg from 'fluent-ffmpeg';
import { fullPathForFile } from '../filesystem/fileManager.js';
import type { FileFields } from '../db/picrDb.js';
import { picrConfig } from '../config/picrConfig.js';

export const ffmpegForFile = (file: FileFields): ffmpeg.FfmpegCommand => {
  return ffmpeg({
    source: fullPathForFile(file),
  }).setFfmpegPath(picrConfig.ffmpegPath ?? 'ffmpeg');
};
