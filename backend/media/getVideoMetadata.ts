import ffmpeg from 'fluent-ffmpeg';
//{ ffprobe, FfprobeData, setFfprobePath }
import util from 'node:util';
import { VideoMetadata } from '../types/MetadataSummary.js';
import { fullPathForFile } from '../filesystem/fileManager.js';
import { FileFields } from '../db/picrDb.js';

export const getVideoMetadata = async (file: FileFields) => {
  ffmpeg.setFfprobePath('node_modules/ffprobe-static/bin/linux/x64/ffprobe');

  //ffprobe is 'traditional callback' style so lets promise-ify it
  const ffprobePromise = util.promisify(ffmpeg.ffprobe);

  try {
    const fullPath = fullPathForFile(file);
    const metadata = (await ffprobePromise(fullPath)) as ffmpeg.FfprobeData;

    const m: VideoMetadata = {};

    // if (err) {
    //   console.log('Error reading metadata for: ' + file.fullPath());
    //   console.log(err);
    // }
    const { format, streams } = metadata;
    m.Bitrate = format.bit_rate;
    m.Duration = format.duration;
    m.Format = format.format_long_name;

    const video = streams.find(({ codec_type }) => codec_type == 'video');
    if (video) {
      m.VideoCodec = video.codec_name;
      m.VideoCodecDescription = video.codec_long_name;
      m.Width = video.width;
      m.Height = video.height;
      m.Framerate = video.avg_frame_rate ? eval(video.avg_frame_rate) ?? 0 : 0; // TODO: convert "25/1" to
    }

    const audio = streams.find(({ codec_type }) => codec_type == 'audio');
    if (audio) {
      m.AudioCodec = audio.codec_name;
      m.AudioCodecDescription = audio.codec_long_name;
    }
    return m;
  } catch (e) {
    console.log(e);
    return {};
  }
};
