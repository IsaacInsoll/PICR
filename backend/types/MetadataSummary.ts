// TODO: Rename to ImageMetadata... plus width/height specs???
// and move to @shared
export interface MetadataSummary {
  Camera?: string | null;
  Lens?: string | null;
  Artist?: string | null;
  DateTimeEdit?: Date | null;
  DateTimeOriginal?: Date | null;
  Aperture?: number | null;
  // ShutterSpeed?: string;
  ISO?: number | null;
  ExposureTime?: number | null; // note this is in seconds so render as 1/${1/ExposureTime} if it's less than 1
  Width?: number | null;
  Height?: number | null;
  Rating?: number | null;
}

export interface VideoMetadata {
  //TODO: pass imageRatio to parent `File` object (for web layout reasons)
  // We can use display_aspect_ratio ('16:9') or do maths on width/height

  // 'format' key: bit_rate, duration, format_long_name
  Bitrate?: number | null;
  Duration?: number | null; // seconds
  Format?: string | null; // EG: "QuickTime / MOV",

  // We will just read the first video and first audio stream as this is a media delivery service,
  // not a detailed analytics service and I want to keep it simple for now (codec_type = 'video' | 'audio'

  VideoCodec?: string | null; //'h264' (codec_name)
  VideoCodecDescription?: string | null; //'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10' (codec_long_name)

  Width?: number | null; // 'width'
  Height?: number | null; // 'height'
  Framerate?: number | null; // video stream r_frame_rate '25/1' or avg_frame_rate '25/1'

  AudioCodec?: string | null; //'pcm_s16le'  (codec_name)
  AudioCodecDescription?: string | null; // 'PCM signed 16-bit little-endian' (codec_long_name)

  //instead of codec_name (h264 or pcm_s16le) we could use codec_tag_string(avc1 or lpcm)

  //audio fields to consider:
  // sample_rate (48000)
  // channels (2)
  // channel_layout (stereo)
  // bits_per_sample 16

  //video fields to consider:
  //pix_fmt 'yuv420p'
  // color_space 'bt709'
  // timecode: 'N/A'
  // is_avc 'true'
  // bits_per_raw_sample: 8
  // bit_rate (just for video)
}
