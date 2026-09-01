import { encode } from 'blurhash';
import {
  mkdir,
  readdir,
  realpath,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { cpus } from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { serverThumbnailDimensions } from '@shared/serverMediaSettings.js';
import {
  thumbnailVariantLadderForSettings,
  type ThumbnailVariant,
} from '@shared/thumbnailVariants.js';
import { openSharp } from '../media/openSharp.js';
import { extractVaapiThumbnailFrames } from '../media/vaapiVideo.js';
import { picrConfig } from '../config/picrConfig.js';
import { probe, runFfmpeg } from '../media/ffmpeg.js';
import { extractZip } from '../helpers/extractZip.js';
import { getServerMediaSettings } from '../media/serverMediaSettings.js';
import { embeddedExifJpegPreviewForImage } from '../media/exifPreview.js';
import { encodeImageThumbnailVariants } from '../media/encodeImageThumbnails.js';
import {
  generateVideoThumbnailArtifacts,
  type VideoCandidateExtractionResult,
} from '../media/videoThumbnailPipeline.js';

const benchmarkAssetUrl = 'https://photosummaryapp.com/picr-demo-data.zip';
const benchmarkAssetDownloadTimeoutMs = 60_000;
const benchmarkFfmpegTimeoutMs = 10 * 60_000;
const benchmarkImageSampleLimit = 10;
const benchmarkVideoSampleLimit = 1;
const benchmarkRoot = () => path.join(picrConfig.cachePath, 'benchmark');
const zipPath = () => path.join(benchmarkRoot(), 'assets.zip');
const assetPath = () => path.join(benchmarkRoot(), 'assets');
const outputPath = () => path.join(benchmarkRoot(), 'output');
const stepOutputPath = (key: string) => path.join(outputPath(), key);

const imageExtensions = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.tif',
  '.tiff',
]);
const videoExtensions = new Set(['.mp4', '.mov', '.m4v', '.webm']);

type BenchmarkStepStatus = 'completed' | 'skipped' | 'failed';

export interface NamedBenchmarkStepResult {
  key: string;
  name: string;
  status: BenchmarkStepStatus;
  ms: number | null;
  skippedReason: string | null;
  outputBytes: bigint | null;
  details: string | null;
  includedInTotal: boolean;
}

export interface BenchmarkResult {
  totalMs: number;
  appVersion: string;
  steps: NamedBenchmarkStepResult[];
  // Snapshot of the resolved acceleration status (for display context).
  videoAccelerationMode: string;
  videoAccelerationReason: string;
  cpuCount: number;
  uvThreadpoolSize: string;
  imageCount: number;
  videoCount: number;
  assetSourceUrl: string;
  assetPath: string;
}

interface RunBenchmarkOptions {
  assetPath?: string | null;
}

interface StepRunResult {
  outputBytes?: bigint | null;
  outputDirectory?: string;
  details?: string | null;
}

interface StepDefinition {
  key: string;
  name: string;
  includedInTotal?: boolean;
  run: () => Promise<StepRunResult | void>;
}

interface BenchmarkAssets {
  path: string;
  sourceUrl: string;
  setup: () => Promise<void>;
}

interface BenchmarkMediaSample {
  images: string[];
  videos: string[];
}

export const runBenchmark = async (
  options?: RunBenchmarkOptions,
): Promise<BenchmarkResult> => {
  await mkdir(benchmarkRoot(), { recursive: true });
  await rm(outputPath(), { recursive: true, force: true });
  await mkdir(outputPath(), { recursive: true });

  const settings = await getServerMediaSettings();
  const legacyThumbnailDimensions = serverThumbnailDimensions();
  const currentThumbnailMediumPx = legacyThumbnailDimensions.md;
  const assets = benchmarkAssets(options?.assetPath);
  const steps: NamedBenchmarkStepResult[] = [];
  const assetSetup = await runStep({
    key: 'asset-setup',
    name: 'Asset Setup',
    includedInTotal: false,
    run: assets.setup,
  });
  steps.push(assetSetup);

  const baseResult = {
    appVersion: picrConfig.version ?? '',
    videoAccelerationMode: picrConfig.videoAccelerationMode,
    videoAccelerationReason: picrConfig.videoAccelerationReason,
    cpuCount: cpus().length,
    uvThreadpoolSize: runtimeUvThreadpoolSize(),
    assetSourceUrl: assets.sourceUrl,
    assetPath: assets.path,
  };

  if (assetSetup.status !== 'completed') {
    return {
      ...baseResult,
      totalMs: 0,
      steps: [
        assetSetup,
        skippedStep('assets-unavailable', 'Benchmark Steps', {
          reason: 'Benchmark assets are unavailable',
        }),
      ],
      imageCount: 0,
      videoCount: 0,
    };
  }

  const mediaFiles = await sampleBenchmarkMediaFiles(assets.path);
  const imageFiles = mediaFiles.images;
  const firstVideo = mediaFiles.videos[0];

  // VAAPI is only exercised when it resolved as the active mode at boot.
  // When it isn't, the accelerated rows are skipped with the startup reason.
  const vaapiActive = picrConfig.videoAccelerationMode === 'vaapi';
  const noVideo = 'No benchmark video found';

  steps.push(
    ...(await imageSteps({
      imageFiles,
      variants: thumbnailVariantLadderForSettings(settings),
    })),
    await videoStep(
      'video-thumbnail-cpu',
      'Video Thumbnail (CPU)',
      firstVideo,
      noVideo,
      (stepDir) =>
        generateProductionVideoThumbnailArtifacts(
          firstVideo as string,
          false,
          stepDir,
          currentThumbnailMediumPx,
          thumbnailVariantLadderForSettings(settings),
        ),
    ),
    await videoStep(
      'video-thumbnail-vaapi',
      'Video Thumbnail (VAAPI)',
      firstVideo,
      noVideo,
      (stepDir) =>
        generateProductionVideoThumbnailArtifacts(
          firstVideo as string,
          true,
          stepDir,
          currentThumbnailMediumPx,
          thumbnailVariantLadderForSettings(settings),
        ),
      vaapiActive ? null : picrConfig.videoAccelerationReason,
    ),
    await videoStep(
      'video-transcode-cpu',
      'Video Transcode (CPU)',
      firstVideo,
      noVideo,
      (stepDir) => transcodeVideo(firstVideo as string, false, stepDir),
    ),
    await videoStep(
      'video-transcode-vaapi',
      'Video Transcode (VAAPI)',
      firstVideo,
      noVideo,
      (stepDir) => transcodeVideo(firstVideo as string, true, stepDir),
      vaapiActive ? null : picrConfig.videoAccelerationReason,
    ),
  );

  return {
    ...baseResult,
    totalMs: totalForIncludedSteps(steps),
    steps,
    imageCount: imageFiles.length,
    videoCount: mediaFiles.videos.length,
  };
};

const benchmarkAssets = (overridePath?: string | null): BenchmarkAssets => {
  if (overridePath?.trim()) {
    const resolved = resolveAssetOverridePath(overridePath.trim());
    return {
      path: resolved,
      sourceUrl: 'local media folder override',
      setup: () => validateAssetOverride(resolved),
    };
  }

  return {
    path: assetPath(),
    sourceUrl: benchmarkAssetUrl,
    setup: ensureAssets,
  };
};

const validateAssetOverride = async (directory: string) => {
  const mediaRoot = await realpath(picrConfig.mediaPath);
  const realDirectory = await realpath(directory);
  if (!isInsidePath(mediaRoot, realDirectory)) {
    throw new Error(
      `Benchmark asset path must be inside the media folder: ${mediaRoot}`,
    );
  }
  const info = await stat(realDirectory);
  if (!info.isDirectory()) {
    throw new Error(`Benchmark asset path is not a directory: ${directory}`);
  }
  if (!(await hasFiles(realDirectory))) {
    throw new Error(`Benchmark asset directory is empty: ${directory}`);
  }
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
  await extractZip(zipPath(), assetPath(), { stripComponents: 1 });
};

const imageSteps = async ({
  imageFiles,
  variants,
}: {
  imageFiles: string[];
  variants: readonly ThumbnailVariant[];
}): Promise<NamedBenchmarkStepResult[]> => {
  if (imageFiles.length === 0) {
    return [skippedStep('image-benchmarks', 'Image Benchmarks')];
  }

  const steps: StepDefinition[] = [
    imageResizeStep({
      key: 'jpeg-thumbnail-variants-image-production',
      name: 'JPEG thumbnail variants, image production pipeline',
      files: imageFiles,
      variants,
      concurrency: picrConfig.thumbnailWorkerCount,
    }),
    blurhashStep({
      key: 'blurhash-exif-preview',
      name: 'Blurhash from EXIF preview',
      files: imageFiles,
    }),
  ];

  const results: NamedBenchmarkStepResult[] = [];
  for (const step of steps) {
    results.push(await runStep(step));
  }
  return results;
};

const imageResizeStep = ({
  key,
  name,
  files,
  variants,
  concurrency = 1,
  includedInTotal,
}: {
  key: string;
  name: string;
  files: string[];
  variants: readonly ThumbnailVariant[];
  concurrency?: number;
  includedInTotal?: boolean;
}): StepDefinition => ({
  key,
  name,
  includedInTotal,
  run: async () => {
    const dir = stepOutputPath(key);
    await mkdir(dir, { recursive: true });
    const workerCount = Math.max(1, Math.floor(concurrency));
    const { failed, firstError, processed } = await mapConcurrent(
      files,
      workerCount,
      (file, index) => encodeImageVariants(file, index, dir, variants),
    );
    if (processed === 0 && failed > 0) {
      throw new Error(
        `No images processed; ${failed} failed${firstErrorDetails(firstError)}`,
      );
    }
    return {
      outputDirectory: dir,
      details: stepDetails([
        `${processed}/${files.length} images`,
        `${variants.length} variants`,
        thumbnailVariantDetails(variants),
        'production encoder',
        `${workerCount} worker${workerCount === 1 ? '' : 's'}`,
        'image production: auto-oriented, EXIF/XMP stripped, sRGB ICC',
        failed > 0 ? `${failed} failed` : null,
        failed > 0 && firstError ? `first error: ${firstError}` : null,
      ]),
    };
  },
});

const encodeImageVariants = async (
  file: string,
  index: number,
  dir: string,
  variants: readonly ThumbnailVariant[],
) => {
  await encodeImageThumbnailVariants(file, variants, (variant) =>
    path.join(dir, `${index}-${variant.token}${variant.extension}`),
  );
};

const thumbnailVariantDetails = (variants: readonly ThumbnailVariant[]) => {
  const formats = new Map<string, { qualities: Set<number>; widths: number }>();
  for (const variant of variants) {
    const existing = formats.get(variant.format) ?? {
      qualities: new Set<number>(),
      widths: 0,
    };
    existing.qualities.add(variant.quality);
    existing.widths++;
    formats.set(variant.format, existing);
  }

  return Array.from(formats.entries())
    .map(([format, { qualities, widths }]) => {
      const qualityText = Array.from(qualities)
        .toSorted((a, b) => a - b)
        .map((quality) => `q${quality}`)
        .join('/');
      return `${format} ${qualityText}, ${widths} width${widths === 1 ? '' : 's'}`;
    })
    .join('; ');
};

const blurhashStep = ({
  key,
  name,
  files,
}: {
  key: string;
  name: string;
  files: string[];
}): StepDefinition => ({
  key,
  name,
  run: async () => {
    let previewHits = 0;
    let fallbackHits = 0;
    let previewFailures = 0;
    let failed = 0;
    let firstError: string | null = null;
    for (const file of files) {
      const preview = await embeddedExifJpegPreviewForImage(file);
      if (preview) {
        try {
          await encodeBlurhashFromInput(preview);
          previewHits++;
          continue;
        } catch {
          previewFailures++;
        }
      }

      try {
        await encodeBlurhashFromInput(file);
        fallbackHits++;
      } catch (error) {
        failed++;
        firstError ??= errorMessage(error);
      }
    }
    const processed = previewHits + fallbackHits;
    if (processed === 0 && failed > 0) {
      throw new Error(
        `No blurhashes processed; ${failed} failed${firstErrorDetails(firstError)}`,
      );
    }

    return {
      details: stepDetails([
        `${processed}/${files.length} images`,
        `${previewHits} EXIF previews`,
        `${fallbackHits} full-decode fallbacks`,
        previewFailures > 0 ? `${previewFailures} invalid EXIF previews` : null,
        failed > 0 ? `${failed} failed` : null,
        failed > 0 && firstError ? `first error: ${firstError}` : null,
      ]),
    };
  },
});

// VAAPI input decode options for the transcode path (decode on GPU).
const vaapiDecodeOptions = () => [
  '-hwaccel',
  'vaapi',
  '-hwaccel_device',
  picrConfig.videoAccelerationDevice,
];

const generateProductionVideoThumbnailArtifacts = async (
  file: string,
  accelerated: boolean,
  stepDir: string,
  thumbnailPx: number,
  variants: readonly ThumbnailVariant[],
) => {
  const { duration, width, height } = await videoInfo(file);
  if (!duration || duration <= 0) {
    throw new Error('Benchmark video has no readable duration');
  }

  const scrubPath = path.join(
    stepDir,
    accelerated ? 'video-scrub-vaapi.jpg' : 'video-scrub-cpu.jpg',
  );
  const posterFramePath = path.join(
    stepDir,
    accelerated ? 'video-poster-frame-vaapi.jpg' : 'video-poster-frame-cpu.jpg',
  );

  const { candidateExtractionMethod } = await generateVideoThumbnailArtifacts({
    sourcePath: file,
    duration,
    thumbnailPx,
    scrubPath,
    posterFramePath,
    variants,
    posterVariantPath: (variant) =>
      path.join(stepDir, `video-poster-${variant.token}${variant.extension}`),
    extractCandidateFrames: accelerated
      ? vaapiCandidateFrameExtractor(width, height)
      : undefined,
  });

  return {
    details: stepDetails([
      `duration ${formatDurationSeconds(duration)}`,
      `candidate extraction: ${candidateExtractionMethod}`,
      `${variants.length} poster variants`,
      thumbnailVariantDetails(variants),
    ]),
  };
};

const vaapiCandidateFrameExtractor =
  (width: number | null, height: number | null) =>
  async (
    sourcePath: string,
    duration: number,
    timestamps: readonly number[],
    thumbnailPx: number,
    framesDir: string,
  ): Promise<VideoCandidateExtractionResult> => {
    if (!width || !height) {
      throw new Error('Could not read video dimensions for VAAPI thumbnails');
    }
    const evenDimensions = evenDimensionsInsideBox(
      thumbnailPx,
      thumbnailPx,
      width,
      height,
    );
    await extractVaapiThumbnailFrames(
      sourcePath,
      [...timestamps],
      evenDimensions.width,
      evenDimensions.height,
      framesDir,
      'md',
      Math.max(15_000, Math.ceil(duration * 1_500)),
    );
    return { method: 'vaapi-split' };
  };

// Whole-video transcode to 720p H.264. CPU uses libx264; the accelerated path
// uses a full VAAPI pipeline (hardware decode → scale_vaapi → h264_vaapi).
// Known limitation (transcoding is forward-looking only): the accelerated row
// requires hardware DECODE too. A GPU that can't hw-decode a given codec but
// could still hw-encode (CPU decode + VAAPI encode) is reported as failed. That
// hybrid shape can be measured once real transcoding exists.
const transcodeVideo = async (
  file: string,
  accelerated: boolean,
  stepDir: string,
) => {
  const out = path.join(
    stepDir,
    accelerated
      ? 'benchmark-transcode-vaapi.mp4'
      : 'benchmark-transcode-cpu.mp4',
  );
  // scale_vaapi needs an explicit width (no `-2` auto-sizing), so derive an
  // even 720p width from the source aspect ratio.
  const accelWidth = accelerated ? await transcodeWidthFor720(file) : 0;

  const args = accelerated
    ? [
        '-y',
        '-hide_banner',
        ...vaapiDecodeOptions(),
        '-hwaccel_output_format',
        'vaapi',
        '-i',
        file,
        '-vf',
        `scale_vaapi=w=${accelWidth}:h=720`,
        '-c:v',
        'h264_vaapi',
        '-an',
        out,
      ]
    : [
        '-y',
        '-hide_banner',
        '-i',
        file,
        '-vf',
        'scale=-2:720',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-pix_fmt',
        'yuv420p',
        '-an',
        out,
      ];

  await runFfmpeg(args, { timeoutMs: benchmarkFfmpegTimeoutMs });
};

interface VideoInfo {
  duration: number | null;
  width: number | null;
  height: number | null;
}

const videoInfo = async (file: string): Promise<VideoInfo> => {
  const data = await probe(file);
  const stream = data.streams.find((s) => s.width && s.height);
  return {
    duration: numericProbeValue(data.format.duration),
    width: stream?.width ?? null,
    height: stream?.height ?? null,
  };
};

const numericProbeValue = (
  value: number | string | undefined,
): number | null => {
  if (value == null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDurationSeconds = (duration: number): string =>
  `${Math.round(duration)}s`;

const evenDimensionsInsideBox = (
  maxWidth: number,
  maxHeight: number,
  srcWidth: number,
  srcHeight: number,
): { width: number; height: number } => {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
  return {
    width: evenDimension(Math.round(srcWidth * ratio)),
    height: evenDimension(Math.round(srcHeight * ratio)),
  };
};

const evenDimension = (value: number): number => {
  const positive = Math.max(2, value);
  return positive % 2 === 0 ? positive : positive - 1;
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
      // Keep media-root containment intact by never following nested symlinks.
      return [];
    }),
  );
  return files.flat();
};

const sampleBenchmarkMediaFiles = async (
  directory: string,
): Promise<BenchmarkMediaSample> => {
  const sample: BenchmarkMediaSample = { images: [], videos: [] };
  await sampleBenchmarkMediaFilesInDirectory(directory, sample);
  return sample;
};

const sampleBenchmarkMediaFilesInDirectory = async (
  directory: string,
  sample: BenchmarkMediaSample,
): Promise<void> => {
  if (benchmarkSampleComplete(sample)) return;

  const entries = (await readdir(directory, { withFileTypes: true })).toSorted(
    (a, b) => a.name.localeCompare(b.name),
  );

  for (const entry of entries) {
    if (benchmarkSampleComplete(sample)) return;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await sampleBenchmarkMediaFilesInDirectory(full, sample);
      continue;
    }
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    if (
      sample.images.length < benchmarkImageSampleLimit &&
      imageExtensions.has(extension)
    ) {
      sample.images.push(full);
      continue;
    }
    if (
      sample.videos.length < benchmarkVideoSampleLimit &&
      videoExtensions.has(extension)
    ) {
      sample.videos.push(full);
    }
  }
};

const benchmarkSampleComplete = ({ images, videos }: BenchmarkMediaSample) =>
  images.length >= benchmarkImageSampleLimit &&
  videos.length >= benchmarkVideoSampleLimit;

const hasFiles = async (directory: string) => {
  try {
    return await hasAnyFile(directory);
  } catch {
    return false;
  }
};

const hasAnyFile = async (directory: string): Promise<boolean> => {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isFile()) return true;
    if (entry.isDirectory() && (await hasAnyFile(full))) return true;
  }
  return false;
};

const fileExists = async (file: string) => {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
};

const runStep = async ({
  key,
  name,
  run,
  includedInTotal = true,
}: StepDefinition): Promise<NamedBenchmarkStepResult> => {
  let start: number | null = null;
  try {
    await rm(stepOutputPath(key), { recursive: true, force: true });
    start = performance.now();
    const result = await run();
    const ms = elapsed(start);
    const { details, outputBytes } = await collectStepOutput(result);
    return {
      key,
      name,
      status: 'completed',
      ms,
      skippedReason: null,
      outputBytes,
      details,
      includedInTotal,
    };
  } catch (error) {
    await rm(stepOutputPath(key), { recursive: true, force: true }).catch(
      () => undefined,
    );
    return {
      key,
      name,
      status: 'failed',
      ms: start == null ? null : elapsed(start),
      skippedReason: error instanceof Error ? error.message : String(error),
      outputBytes: null,
      details: null,
      includedInTotal,
    };
  }
};

const skippedStep = (
  key: string,
  name: string,
  options?: { reason?: string; includedInTotal?: boolean },
): NamedBenchmarkStepResult => ({
  key,
  name,
  status: 'skipped',
  ms: null,
  skippedReason: options?.reason ?? 'No benchmark images found',
  outputBytes: null,
  details: null,
  includedInTotal: options?.includedInTotal ?? true,
});

const videoStep = async (
  key: string,
  name: string,
  file: string | undefined,
  missingReason: string,
  run: (stepDir: string) => Promise<StepRunResult | void>,
  skippedReason?: string | null,
): Promise<NamedBenchmarkStepResult> => {
  if (!file) return skippedStep(key, name, { reason: missingReason });
  if (skippedReason) return skippedStep(key, name, { reason: skippedReason });
  return runStep({
    key,
    name,
    run: async () => {
      const dir = stepOutputPath(key);
      await mkdir(dir, { recursive: true });
      const result = await run(dir);
      return { ...result, outputDirectory: dir };
    },
  });
};

interface FileProcessingResult {
  processed: number;
  failed: number;
  firstError: string | null;
}

const mapConcurrent = async <T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<FileProcessingResult> => {
  let nextIndex = 0;
  let processed = 0;
  let failed = 0;
  let firstError: string | null = null;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      for (;;) {
        const index = nextIndex++;
        const item = items[index];
        if (item === undefined) return;
        try {
          await fn(item, index);
          processed++;
        } catch (error) {
          failed++;
          firstError ??= errorMessage(error);
        }
      }
    }),
  );
  return { processed, failed, firstError };
};

const directorySize = async (directory: string): Promise<bigint> => {
  const files = await listFiles(directory);
  const sizes = await Promise.all(files.map((file) => stat(file)));
  return sizes.reduce((total, file) => total + BigInt(file.size), 0n);
};

const encodeBlurhashFromInput = async (input: Buffer | string) => {
  const { data, info } = await openSharp(input)
    .rotate()
    .raw()
    .ensureAlpha()
    .resize(32, 32, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });

  return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 4);
};

const resolveAssetOverridePath = (requestedPath: string) => {
  const mediaRoot = path.resolve(picrConfig.mediaPath);
  return path.isAbsolute(requestedPath)
    ? path.resolve(requestedPath)
    : path.resolve(mediaRoot, requestedPath);
};

const isInsidePath = (parent: string, child: string) => {
  const relative = path.relative(parent, child);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
};

const runtimeUvThreadpoolSize = () =>
  process.env['UV_THREADPOOL_SIZE'] ?? '4 (default)';

const firstErrorDetails = (firstError: string | null) =>
  firstError ? `; first error: ${firstError}` : '';

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const totalForIncludedSteps = (steps: NamedBenchmarkStepResult[]) =>
  steps.reduce(
    (total, step) =>
      step.status === 'completed' && step.includedInTotal && step.ms != null
        ? total + step.ms
        : total,
    0,
  );

const collectStepOutput = async (
  result: StepRunResult | void,
): Promise<Pick<NamedBenchmarkStepResult, 'details' | 'outputBytes'>> => {
  const outputDirectory = result?.outputDirectory;
  const details: string[] = [];
  if (result?.details) details.push(result.details);

  let outputBytes = result?.outputBytes ?? null;
  if (outputDirectory) {
    try {
      outputBytes = await directorySize(outputDirectory);
    } catch (error) {
      details.push(
        `output size unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    try {
      await rm(outputDirectory, { recursive: true, force: true });
    } catch (error) {
      details.push(
        `output cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return {
    details: stepDetails(details),
    outputBytes,
  };
};

const stepDetails = (parts: Array<string | null | undefined>) =>
  parts.filter((part): part is string => Boolean(part)).join(', ') || null;

const elapsed = (start: number) => Math.round(performance.now() - start);
