import type { PicrVideoMetadata } from '@shared/types/metadata.js';
import { fullPathForFile } from '../filesystem/fileManager.js';
import type { FileFields } from '../db/picrDb.js';
import { log } from '../logger.js';
import { probe, type FfprobeStream } from './ffmpeg.js';

export const getVideoMetadata = async (
  file: Pick<FileFields, 'name' | 'relativePath'>,
) => {
  try {
    const metadata = await probe(fullPathForFile(file));
    const m: PicrVideoMetadata = {};

    const { format, streams } = metadata;
    m.Bitrate = numberOrUndefined(format.bit_rate);
    m.Duration = numberOrUndefined(format.duration);
    m.Format = format.format_long_name;

    const video = streams.find(({ codec_type }) => codec_type === 'video');
    if (video) {
      const { width, height } = displayedDimensionsForVideoStream(video);
      m.VideoCodec = video.codec_name;
      m.VideoCodecDescription = video.codec_long_name;
      m.Width = width;
      m.Height = height;
      m.Framerate = parseFrameRate(video.avg_frame_rate);
    }

    const audio = streams.find(({ codec_type }) => codec_type === 'audio');
    if (audio) {
      m.AudioCodec = audio.codec_name;
      m.AudioCodecDescription = audio.codec_long_name;
    }
    return m;
  } catch (e) {
    log('error', `Error reading video metadata for ${file.name}: ${String(e)}`);
    return {};
  }
};

const numberOrUndefined = (
  value: number | string | null | undefined,
): number | undefined => {
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseFrameRate = (value: string | undefined): number => {
  if (!value) return 0;
  const [numerator, denominator] = value.split('/').map(Number);
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return 0;
  }
  return numerator / denominator;
};

export const displayedDimensionsForVideoStream = (
  stream: FfprobeStream,
): { width?: number; height?: number } => {
  const { width, height } = stream;
  if (!width || !height) return { width, height };

  return shouldSwapDimensions(rotationForStream(stream))
    ? { width: height, height: width }
    : { width, height };
};

export const shouldSwapDimensions = (rotation: number): boolean => {
  const normalized = Math.abs(((rotation % 360) + 360) % 360);
  return normalized === 90 || normalized === 270;
};

const rotationForStream = (stream: FfprobeStream): number => {
  const tagRotation = numberOrUndefined(stream.tags?.['rotate']);
  if (tagRotation !== undefined) return tagRotation;

  const sideDataRotation = stream.side_data_list
    ?.map((sideData) => numberOrUndefined(sideData.rotation))
    .find((rotation) => rotation !== undefined);
  return sideDataRotation ?? 0;
};
