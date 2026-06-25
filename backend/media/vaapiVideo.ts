import ffmpeg from 'fluent-ffmpeg';
import path from 'node:path';
import { picrConfig } from '../config/picrConfig.js';

// VAAPI thumbnail montage pipeline. BENCHMARK / REFERENCE ONLY — this is NOT
// used for production thumbnail generation. Benchmarking on real hardware showed
// VAAPI ~16-19% slower than CPU for the 10-frame seek montage, so production
// thumbnails stay on the CPU path (see backend/media/generateVideoThumbnail.ts).
// It is retained so the admin benchmark can keep comparing CPU vs VAAPI, and as a
// proven starting point if future hardware/codecs ever flip that result.
//
// Mirrors the process model of fluent-ffmpeg's takeScreenshots() (a SINGLE ffmpeg
// process: one decode, a `split` filter fanning out to N seeked frame outputs) so
// the benchmark is a fair CPU-vs-VAAPI comparison — not N process startups + N
// device inits. Per frame: GPU decode -> scale_vaapi -> hwdownload -> JPEG.
// Dimensions are passed explicitly (even numbers); scale_vaapi does not support
// `-2` auto sizing the way CPU `scale` does, and explicit dims keep the output
// identical to the CPU montage.
export const extractVaapiThumbnailFrames = (
  source: string,
  timemarks: number[],
  width: number,
  height: number,
  framesDir: string,
  filenamePrefix: string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const count = timemarks.length;
    const first = timemarks[0] ?? 0;
    const splitLabels = Array.from(
      { length: count },
      (_, index) => `[s${index}]`,
    ).join('');

    const command = ffmpeg({ source })
      .setFfmpegPath(picrConfig.ffmpegPath ?? 'ffmpeg')
      .inputOptions([
        '-hwaccel',
        'vaapi',
        '-hwaccel_device',
        picrConfig.videoAccelerationDevice,
        '-hwaccel_output_format',
        'vaapi',
      ])
      // fast-seek to the first timemark; later outputs seek relative to it
      .seekInput(first)
      .complexFilter(
        `[0:v]scale_vaapi=w=${width}:h=${height},hwdownload,format=nv12,split=${count}${splitLabels}`,
      );

    timemarks.forEach((time, index) => {
      const outputOptions = ['-map', `[s${index}]`, '-frames:v', '1'];
      if (index > 0) outputOptions.push('-ss', String(time - first));
      command
        .output(path.join(framesDir, `${filenamePrefix}_${index + 1}.jpg`))
        .outputOptions(outputOptions);
    });

    command
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
