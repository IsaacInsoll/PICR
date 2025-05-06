import ffmpeg from 'fluent-ffmpeg';
import { fullPathForFile } from '../filesystem/fileManager.js';
import { FileFields } from '../db/picrDb.js';

export const ffmpegForFile = (file: FileFields): ffmpeg.FfmpegCommand => {
  return ffmpeg({
    source: fullPathForFile(file),
  }).setFfmpegPath('node_modules/ffmpeg-static/ffmpeg');
};
