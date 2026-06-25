import decompress from 'decompress';
import ffmpeg from 'fluent-ffmpeg';
import * as ji from 'join-images';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { thumbnailDimensions } from '@shared/thumbnailDimensions.js';
import { openSharp } from '../media/openSharp.js';
import { extractVaapiThumbnailFrames } from '../media/vaapiVideo.js';
import { picrConfig } from '../config/picrConfig.js';

const benchmarkAssetUrl = 'https://photosummaryapp.com/picr-demo-data.zip';
const benchmarkAssetDownloadTimeoutMs = 60_000;
const benchmarkRoot = () => path.join(picrConfig.cachePath, 'benchmark');
const zipPath = () => path.join(benchmarkRoot(), 'assets.zip');
const assetPath = () => path.join(benchmarkRoot(), 'assets');
const outputPath = () => path.join(benchmarkRoot(), 'output');

const imageExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.tif',
  '.tiff',
]);
const videoExtensions = new Set(['.mp4', '.mov', '.m4v', '.webm']);

export interface BenchmarkStepResult {
  ms: number | null;
  skippedReason: string | null;
}

export interface BenchmarkResult {
  totalMs: number;
  appVersion: string;
  assetSetup: BenchmarkStepResult;
  jpegResize: BenchmarkStepResult;
  avifResize: BenchmarkStepResult;
  // Video steps are split into CPU vs hardware-accelerated. The accelerated
  // rows are skipped (with a reason) when VAAPI is not the active mode.
  videoThumbnailCpu: BenchmarkStepResult;
  videoThumbnailAccelerated: BenchmarkStepResult;
  videoTranscodeCpu: BenchmarkStepResult;
  videoTranscodeAccelerated: BenchmarkStepResult;
  // Snapshot of the resolved acceleration status (for display context).
  videoAccelerationMode: string;
  videoAccelerationReason: string;
  imageCount: number;
  videoCount: number;
  assetSourceUrl: string;
  assetPath: string;
}

export const runBenchmark = async (): Promise<BenchmarkResult> => {
  await mkdir(benchmarkRoot(), { recursive: true });
  await rm(outputPath(), { recursive: true, force: true });
  await mkdir(outputPath(), { recursive: true });

  const assetSetup = await timedStep(() => ensureAssets());
  if (assetSetup.skippedReason) {
    return {
      totalMs: 0,
      appVersion: picrConfig.version ?? '',
      assetSetup,
      jpegResize: skipped('Benchmark assets are unavailable'),
      avifResize: skipped('Benchmark assets are unavailable'),
      videoThumbnailCpu: skipped('Benchmark assets are unavailable'),
      videoThumbnailAccelerated: skipped('Benchmark assets are unavailable'),
      videoTranscodeCpu: skipped('Benchmark assets are unavailable'),
      videoTranscodeAccelerated: skipped('Benchmark assets are unavailable'),
      videoAccelerationMode: picrConfig.videoAccelerationMode,
      videoAccelerationReason: picrConfig.videoAccelerationReason,
      imageCount: 0,
      videoCount: 0,
      assetSourceUrl: benchmarkAssetUrl,
      assetPath: assetPath(),
    };
  }

  const files = await listFiles(assetPath());
  const imageFiles = files.filter((file) =>
    imageExtensions.has(path.extname(file).toLowerCase()),
  );
  const videoFiles = files.filter((file) =>
    videoExtensions.has(path.extname(file).toLowerCase()),
  );
  const firstVideo = videoFiles.toSorted()[0];

  // VAAPI is only exercised when it resolved as the active mode at boot.
  // When it isn't, the accelerated rows are skipped with the startup reason.
  const vaapiActive = picrConfig.videoAccelerationMode === 'vaapi';
  const noVideo = 'No benchmark video found';

  const totalStart = performance.now();
  const jpegResize =
    imageFiles.length > 0
      ? await timedStep(() => resizeImages(imageFiles, 'jpeg'))
      : skipped('No benchmark images found');
  const avifResize =
    imageFiles.length > 0
      ? await timedStep(() => resizeImages(imageFiles, 'avif'))
      : skipped('No benchmark images found');

  const videoThumbnailCpu = firstVideo
    ? await timedStep(() => generateVideoMontage(firstVideo, false))
    : skipped(noVideo);
  const videoThumbnailAccelerated = !firstVideo
    ? skipped(noVideo)
    : vaapiActive
      ? await timedStep(() => generateVideoMontage(firstVideo, true))
      : skipped(picrConfig.videoAccelerationReason);

  const videoTranscodeCpu = firstVideo
    ? await timedStep(() => transcodeVideo(firstVideo, false))
    : skipped(noVideo);
  const videoTranscodeAccelerated = !firstVideo
    ? skipped(noVideo)
    : vaapiActive
      ? await timedStep(() => transcodeVideo(firstVideo, true))
      : skipped(picrConfig.videoAccelerationReason);

  return {
    totalMs: elapsed(totalStart),
    appVersion: picrConfig.version ?? '',
    assetSetup,
    jpegResize,
    avifResize,
    videoThumbnailCpu,
    videoThumbnailAccelerated,
    videoTranscodeCpu,
    videoTranscodeAccelerated,
    videoAccelerationMode: picrConfig.videoAccelerationMode,
    videoAccelerationReason: picrConfig.videoAccelerationReason,
    imageCount: imageFiles.length,
    videoCount: videoFiles.length,
    assetSourceUrl: benchmarkAssetUrl,
    assetPath: assetPath(),
  };
};

const ensureAssets = async () => {
  if ((await hasFiles(assetPath())) && (await fileExists(zipPath()))) return;

  if (!(await fileExists(zipPath()))) {
    const response = await fetch(benchmarkAssetUrl, {
      headers: {
        Accept: 'application/zip,*/*',
        'User-Agent': 'Mozilla/5.0 PICR Benchmark Downloader',
      },
      signal: AbortSignal.timeout(benchmarkAssetDownloadTimeoutMs),
    });
    if (!response.ok) {
      throw new Error(
        `Could not download benchmark assets: HTTP ${response.status}`,
      );
    }
    const data = Buffer.from(await response.arrayBuffer());
    await writeFile(zipPath(), data);
  }

  await rm(assetPath(), { recursive: true, force: true });
  await mkdir(assetPath(), { recursive: true });
  await decompress(zipPath(), assetPath(), { strip: 1 });
};

const resizeImages = async (files: string[], format: 'jpeg' | 'avif') => {
  const formatDir = path.join(outputPath(), format);
  await mkdir(formatDir, { recursive: true });

  for (const [index, file] of files.entries()) {
    for (const [size, px] of Object.entries(thumbnailDimensions)) {
      const out = path.join(formatDir, `${index}-${size}.${format}`);
      const image = openSharp(file).withMetadata().resize(px, px, {
        fit: 'inside',
        withoutEnlargement: true,
      });
      if (format === 'jpeg') {
        await image.jpeg({ quality: 60 }).toFile(out);
      } else {
        await image.avif({ quality: 45 }).toFile(out);
      }
    }
  }
};

// VAAPI input decode options for the transcode path (decode on GPU).
const vaapiDecodeOptions = () => [
  '-hwaccel',
  'vaapi',
  '-hwaccel_device',
  picrConfig.videoAccelerationDevice,
];

const generateVideoMontage = async (file: string, accelerated: boolean) => {
  const framesDir = path.join(
    outputPath(),
    accelerated ? 'video-thumbnail-frames-vaapi' : 'video-thumbnail-frames-cpu',
  );
  await mkdir(framesDir, { recursive: true });
  const { duration, width, height } = await videoInfo(file);
  if (!duration || duration <= 0) {
    throw new Error('Benchmark video has no readable duration');
  }

  const px = thumbnailDimensions.md;
  const timemarks = Array.from(
    { length: 10 },
    (_, index) => (index / 10) * duration,
  );
  // Explicit, identical even dimensions for both paths so the montages match
  // and scale_vaapi (which lacks `-2` auto-sizing) gets a concrete height.
  const targetHeight =
    width && height ? evenHeightForWidth(px, width, height) : undefined;

  if (accelerated) {
    if (!targetHeight) {
      throw new Error('Could not read video dimensions for VAAPI thumbnails');
    }
    // Single-process scale_vaapi montage — kept purely for the CPU-vs-VAAPI
    // comparison below. Production thumbnails stay on CPU (VAAPI benchmarked
    // slower for this workload); see extractVaapiThumbnailFrames.
    await extractVaapiThumbnailFrames(
      file,
      timemarks,
      px,
      targetHeight,
      framesDir,
      'md',
    );
  } else {
    await new Promise<void>((resolve, reject) => {
      ffmpeg({ source: file })
        .setFfmpegPath(picrConfig.ffmpegPath ?? 'ffmpeg')
        .on('end', () => resolve())
        .on('error', reject)
        .takeScreenshots({
          filename: 'md.jpg',
          timemarks,
          folder: framesDir,
          size: targetHeight ? `${px}x${targetHeight}` : `${px}x?`,
        });
    });
  }

  const files = Array.from({ length: 10 }, (_, index) =>
    path.join(framesDir, `md_${index + 1}.jpg`),
  );
  const image = await ji.joinImages(files, { direction: 'vertical' });
  await image.toFile(
    path.join(
      outputPath(),
      accelerated
        ? 'video-thumbnail-joined-vaapi.jpg'
        : 'video-thumbnail-joined-cpu.jpg',
    ),
  );
};

// Whole-video transcode to 720p H.264. CPU uses libx264; the accelerated path
// uses a full VAAPI pipeline (hardware decode → scale_vaapi → h264_vaapi).
// Known limitation (transcoding is forward-looking only): the accelerated row
// requires hardware DECODE too. A GPU that can't hw-decode a given codec but
// could still hw-encode (CPU decode + VAAPI encode) is reported as failed. That
// hybrid shape can be measured once real transcoding exists.
const transcodeVideo = async (file: string, accelerated: boolean) => {
  const out = path.join(
    outputPath(),
    accelerated
      ? 'benchmark-transcode-vaapi.mp4'
      : 'benchmark-transcode-cpu.mp4',
  );
  // scale_vaapi needs an explicit width (no `-2` auto-sizing), so derive an
  // even 720p width from the source aspect ratio.
  const accelWidth = accelerated ? await transcodeWidthFor720(file) : 0;
  await new Promise<void>((resolve, reject) => {
    const command = ffmpeg({ source: file }).setFfmpegPath(
      picrConfig.ffmpegPath ?? 'ffmpeg',
    );
    if (accelerated) {
      command
        .inputOptions([
          ...vaapiDecodeOptions(),
          '-hwaccel_output_format',
          'vaapi',
        ])
        .videoFilter(`scale_vaapi=w=${accelWidth}:h=720`)
        .videoCodec('h264_vaapi')
        .outputOptions(['-an']);
    } else {
      command
        .videoCodec('libx264')
        .size('?x720')
        .outputOptions(['-preset veryfast', '-pix_fmt yuv420p', '-an']);
    }
    command
      .output(out)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
};

interface VideoInfo {
  duration: number | null;
  width: number | null;
  height: number | null;
}

const videoInfo = async (file: string): Promise<VideoInfo> => {
  return new Promise((resolve, reject) => {
    ffmpeg.setFfprobePath(picrConfig.ffprobePath ?? 'ffprobe');
    ffmpeg.ffprobe(file, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      const stream = data.streams.find((s) => s.width && s.height);
      resolve({
        duration: data.format.duration ?? null,
        width: stream?.width ?? null,
        height: stream?.height ?? null,
      });
    });
  });
};

// Even dimensions preserving aspect ratio (h.264/nv12 require even sizes).
const evenHeightForWidth = (
  targetWidth: number,
  srcWidth: number,
  srcHeight: number,
): number => {
  const h = Math.round((targetWidth * srcHeight) / srcWidth);
  return h % 2 === 0 ? h : h + 1;
};

const transcodeWidthFor720 = async (file: string): Promise<number> => {
  const { width, height } = await videoInfo(file);
  if (!width || !height) {
    throw new Error('Could not read video dimensions for VAAPI transcode');
  }
  const w = Math.round((720 * width) / height);
  return w % 2 === 0 ? w : w + 1;
};

const listFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) return listFiles(full);
      if (entry.isFile()) return [full];
      return [];
    }),
  );
  return files.flat();
};

const hasFiles = async (directory: string) => {
  try {
    return (await listFiles(directory)).length > 0;
  } catch {
    return false;
  }
};

const fileExists = async (file: string) => {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
};

const timedStep = async (
  fn: () => Promise<void>,
): Promise<BenchmarkStepResult> => {
  const start = performance.now();
  try {
    await fn();
    return { ms: elapsed(start), skippedReason: null };
  } catch (error) {
    return {
      ms: null,
      skippedReason: error instanceof Error ? error.message : String(error),
    };
  }
};

const skipped = (reason: string): BenchmarkStepResult => ({
  ms: null,
  skippedReason: reason,
});

const elapsed = (start: number) => Math.round(performance.now() - start);
