import decompress from 'decompress';
import ffmpeg from 'fluent-ffmpeg';
import * as ji from 'join-images';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { thumbnailDimensions } from '@shared/thumbnailDimensions.js';
import { openSharp } from '../media/openSharp.js';
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
  videoThumbnail: BenchmarkStepResult;
  videoTranscode: BenchmarkStepResult;
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
      videoThumbnail: skipped('Benchmark assets are unavailable'),
      videoTranscode: skipped('Benchmark assets are unavailable'),
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

  const totalStart = performance.now();
  const jpegResize =
    imageFiles.length > 0
      ? await timedStep(() => resizeImages(imageFiles, 'jpeg'))
      : skipped('No benchmark images found');
  const avifResize =
    imageFiles.length > 0
      ? await timedStep(() => resizeImages(imageFiles, 'avif'))
      : skipped('No benchmark images found');
  const videoThumbnail = firstVideo
    ? await timedStep(() => generateVideoMontage(firstVideo))
    : skipped('No benchmark video found');
  const videoTranscode = firstVideo
    ? await timedStep(() => transcodeVideo(firstVideo))
    : skipped('No benchmark video found');

  return {
    totalMs: elapsed(totalStart),
    appVersion: picrConfig.version ?? '',
    assetSetup,
    jpegResize,
    avifResize,
    videoThumbnail,
    videoTranscode,
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

const generateVideoMontage = async (file: string) => {
  const framesDir = path.join(outputPath(), 'video-thumbnail-frames');
  await mkdir(framesDir, { recursive: true });
  const duration = await videoDuration(file);
  if (!duration || duration <= 0) {
    throw new Error('Benchmark video has no readable duration');
  }

  const timemarks = Array.from(
    { length: 10 },
    (_, index) => (index / 10) * duration,
  );

  await new Promise<void>((resolve, reject) => {
    ffmpeg({ source: file })
      .setFfmpegPath(picrConfig.ffmpegPath ?? 'ffmpeg')
      .on('end', () => resolve())
      .on('error', reject)
      .takeScreenshots({
        filename: 'md.jpg',
        timemarks,
        folder: framesDir,
        size: `${thumbnailDimensions.md}x?`,
      });
  });

  const files = Array.from({ length: 10 }, (_, index) =>
    path.join(framesDir, `md_${index + 1}.jpg`),
  );
  const image = await ji.joinImages(files, { direction: 'vertical' });
  await image.toFile(path.join(outputPath(), 'video-thumbnail-joined.jpg'));
};

const transcodeVideo = async (file: string) => {
  const out = path.join(outputPath(), 'benchmark-transcode.mp4');
  await new Promise<void>((resolve, reject) => {
    ffmpeg({ source: file })
      .setFfmpegPath(picrConfig.ffmpegPath ?? 'ffmpeg')
      .duration(10)
      .videoCodec('libx264')
      .size('?x720')
      .outputOptions(['-preset veryfast', '-pix_fmt yuv420p', '-an'])
      .output(out)
      .on('end', () => resolve())
      .on('error', reject)
      .run();
  });
};

const videoDuration = async (file: string): Promise<number | null> => {
  return new Promise((resolve, reject) => {
    ffmpeg.setFfprobePath(picrConfig.ffprobePath ?? 'ffprobe');
    ffmpeg.ffprobe(file, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data.format.duration ?? null);
    });
  });
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
