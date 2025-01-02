import FileModel from '../db/FileModel';
import { ffprobe, FfprobeData, setFfprobePath } from 'fluent-ffmpeg';
import util from 'node:util';
import { VideoMetadata } from '../types/MetadataSummary';

export const getVideoMetadata = async (file: FileModel) => {
  setFfprobePath('node_modules/ffprobe-static/bin/linux/x64/ffprobe');

  //ffprobe is 'traditional callback' style so lets promise-ify it
  const ffprobePromise = util.promisify(ffprobe);

  try {
    const metadata = (await ffprobePromise(file.fullPath())) as FfprobeData;

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
      m.Framerate = eval(video.avg_frame_rate) ?? 0; // TODO: convert "25/1" to
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
