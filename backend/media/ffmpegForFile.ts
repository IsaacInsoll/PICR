import FileModel from '../db/FileModel';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';

export const ffmpegForFile = (file: FileModel): FfmpegCommand => {
  return ffmpeg({
    source: file.fullPath(),
  }).setFfmpegPath('node_modules/ffmpeg-static/ffmpeg');
};
