import ffmpeg from 'fluent-ffmpeg';
import { fullPathForFile } from '../filesystem/fileManager.js';
import { FileFields } from '../db/picrDb.js';

export const ffmpegForFile = (file: FileFields): ffmpeg.FfmpegCommand => {
  //TODO: fix this not working in dev server as it needs prefix of `dist/`
  return ffmpeg({
    source: fullPathForFile(file),
  }).setFfmpegPath('node_modules/ffmpeg-static/ffmpeg');
};
