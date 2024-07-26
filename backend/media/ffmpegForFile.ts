import File from '../models/File';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';

export const ffmpegForFile = (file: File): FfmpegCommand => {
  return ffmpeg({
    source: file.fullPath(),
  }).setFfmpegPath('node_modules/ffmpeg-static/ffmpeg');
};
