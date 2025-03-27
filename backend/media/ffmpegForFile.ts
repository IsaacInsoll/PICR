import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import { fullPathForFile } from '../filesystem/fileManager';
import { FileFields } from '../db/picrDb';

export const ffmpegForFile = (file: FileFields): FfmpegCommand => {
  return ffmpeg({
    source: fullPathForFile(file),
  }).setFfmpegPath('node_modules/ffmpeg-static/ffmpeg');
};
