import path from 'node:path';
import { picrConfig } from '../config/picrConfig.js';
import { runFfmpeg } from './ffmpeg.js';

// VAAPI thumbnail montage pipeline. BENCHMARK / REFERENCE ONLY — this is NOT
// used for production thumbnail generation. It is retained so the admin
// benchmark can compare CPU vs VAAPI on real hardware, and as a proven starting
// point if future hardware/codecs justify an accelerated production path.
//
// Uses a single ffmpeg process: one decode, a `split` filter fanning out to N
// seeked frame outputs. The CPU benchmark row reports whether it used the
// matching split path or the long-video seek-loop fallback, so long-video
// CPU-vs-VAAPI comparisons are not mistaken for identical algorithms. Per frame:
// GPU decode -> scale_vaapi -> hwdownload -> JPEG.
// Dimensions are passed explicitly (even numbers); scale_vaapi does not support
// `-2` auto sizing the way CPU `scale` does, and explicit dims keep the output
// identical to the CPU montage.
export const extractVaapiThumbnailFrames = async (
  source: string,
  timemarks: readonly number[],
  width: number,
  height: number,
  framesDir: string,
  filenamePrefix: string,
  timeoutMs?: number,
): Promise<void> => {
  const count = timemarks.length;
  const first = timemarks[0] ?? 0;
  const splitLabels = Array.from(
    { length: count },
    (_, index) => `[s${index}]`,
  ).join('');

  const args = [
    '-y',
    '-hide_banner',
    '-ss',
    String(first),
    '-hwaccel',
    'vaapi',
    '-hwaccel_device',
    picrConfig.videoAccelerationDevice,
    '-hwaccel_output_format',
    'vaapi',
    '-i',
    source,
    '-filter_complex',
    `[0:v]scale_vaapi=w=${width}:h=${height},hwdownload,format=nv12,split=${count}${splitLabels}`,
  ];

  timemarks.forEach((time, index) => {
    args.push('-map', `[s${index}]`);
    if (index > 0) args.push('-ss', String(time - first));
    args.push(
      '-frames:v',
      '1',
      '-q:v',
      '4',
      path.join(framesDir, `${filenamePrefix}_${index + 1}.jpg`),
    );
  });

  await runFfmpeg(args, timeoutMs === undefined ? undefined : { timeoutMs });
};
