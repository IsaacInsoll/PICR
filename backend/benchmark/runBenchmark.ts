import * as ji from 'join-images';
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
import { openSharp } from '../media/openSharp.js';
import { extractVaapiThumbnailFrames } from '../media/vaapiVideo.js';
import { picrConfig } from '../config/picrConfig.js';
import { probe, runFfmpeg } from '../media/ffmpeg.js';
import { extractZip } from '../helpers/extractZip.js';
import { getServerMediaSettings } from '../media/serverMediaSettings.js';
import { embeddedExifJpegPreviewForImage } from '../media/exifPreview.js';

const benchmarkAssetUrl = 'https://photosummaryapp.com/picr-demo-data.zip';
const benchmarkAssetDownloadTimeoutMs = 60_000;
const benchmarkFfmpegTimeoutMs = 10 * 60_000;
const benchmarkRoot = () => path.join(picrConfig.cachePath, 'benchmark');
const zipPath = () => path.join(benchmarkRoot(), 'assets.zip');
const assetPath = () => path.join(benchmarkRoot(), 'assets');
const outputPath = () => path.join(benchmarkRoot(), 'output');
const stepOutputPath = (key: string) => path.join(outputPath(), key);

const futureThumbnailLadder = [
  250, 500, 750, 1000, 1500, 2048, 2560, 4000,
] as const;

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
type ImageResizeMode = 'decode-per-size' | 'decode-once';
type ImageResizePipeline =
  | 'legacy-metadata'
  | 'image-production-srgb'
  | 'future-keep-icc';

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

export const runBenchmark = async (
  options?: RunBenchmarkOptions,
): Promise<BenchmarkResult> => {
  await mkdir(benchmarkRoot(), { recursive: true });
  await rm(outputPath(), { recursive: true, force: true });
  await mkdir(outputPath(), { recursive: true });

  const settings = await getServerMediaSettings();
  const currentThumbnailLadder = Object.values(
    serverThumbnailDimensions(settings),
  );
  const currentThumbnailMediumPx = settings.thumbnailMediumPx;
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

  const files = await listFiles(assets.path);
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

  steps.push(
    ...(await imageSteps({
      imageFiles,
      currentThumbnailLadder,
      currentJpegQuality: settings.thumbnailJpegQuality,
    })),
    await videoStep(
      'video-thumbnail-cpu',
      'Video Thumbnail (CPU)',
      firstVideo,
      noVideo,
      (stepDir) =>
        generateVideoMontage(
          firstVideo as string,
          false,
          stepDir,
          currentThumbnailMediumPx,
        ),
    ),
    await videoStep(
      'video-thumbnail-vaapi',
      'Video Thumbnail (VAAPI)',
      firstVideo,
      noVideo,
      (stepDir) =>
        generateVideoMontage(
          firstVideo as string,
          true,
          stepDir,
          currentThumbnailMediumPx,
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
    videoCount: videoFiles.length,
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
  currentThumbnailLadder,
  currentJpegQuality,
}: {
  imageFiles: string[];
  currentThumbnailLadder: number[];
  currentJpegQuality: number;
}): Promise<NamedBenchmarkStepResult[]> => {
  if (imageFiles.length === 0) {
    return [skippedStep('image-benchmarks', 'Image Benchmarks')];
  }

  const steps: StepDefinition[] = [
    imageResizeStep({
      key: 'jpeg-current-config-legacy-metadata',
      name: `JPEG q${currentJpegQuality} current ladder, pre-R0 metadata pipeline`,
      files: imageFiles,
      sizes: currentThumbnailLadder,
      quality: currentJpegQuality,
      mode: 'decode-per-size',
      pipeline: 'legacy-metadata',
    }),
    imageResizeStep({
      key: 'jpeg-current-config-image-production-decode-once',
      name: `JPEG q${currentJpegQuality} current ladder, image production pipeline`,
      files: imageFiles,
      sizes: currentThumbnailLadder,
      quality: currentJpegQuality,
      mode: 'decode-once',
      pipeline: 'image-production-srgb',
    }),
    imageResizeStep({
      key: 'jpeg-ladder-q75-image-production-decode-once',
      name: 'JPEG q75 full ladder, image production pipeline',
      files: imageFiles,
      sizes: futureThumbnailLadder,
      quality: 75,
      mode: 'decode-once',
      pipeline: 'image-production-srgb',
    }),
    imageResizeStep({
      key: 'jpeg-ladder-q80-image-production-decode-per-size',
      name: 'JPEG q80 full ladder, image production pipeline, decode per size',
      files: imageFiles,
      sizes: futureThumbnailLadder,
      quality: 80,
      mode: 'decode-per-size',
      pipeline: 'image-production-srgb',
    }),
    ...[1, 2, 4, 8].map((concurrency) =>
      imageResizeStep({
        key: `jpeg-ladder-q80-image-production-decode-once-c${concurrency}`,
        name: `JPEG q80 full ladder, image production pipeline, ${concurrency} worker${concurrency === 1 ? '' : 's'}`,
        files: imageFiles,
        sizes: futureThumbnailLadder,
        quality: 80,
        mode: 'decode-once',
        pipeline: 'image-production-srgb',
        concurrency,
      }),
    ),
    imageResizeStep({
      key: 'jpeg-ladder-q80-future-keep-icc-decode-per-size',
      name: 'JPEG q80 full ladder, future keep ICC, decode per size',
      files: imageFiles,
      sizes: futureThumbnailLadder,
      quality: 80,
      mode: 'decode-per-size',
      pipeline: 'future-keep-icc',
      includedInTotal: false,
    }),
    imageResizeStep({
      key: 'jpeg-ladder-q85-image-production-decode-once',
      name: 'JPEG q85 full ladder, image production pipeline',
      files: imageFiles,
      sizes: futureThumbnailLadder,
      quality: 85,
      mode: 'decode-once',
      pipeline: 'image-production-srgb',
    }),
    blurhashStep({
      key: 'blurhash-full-decode',
      name: 'Blurhash from full decode',
      files: imageFiles,
      mode: 'full',
    }),
    blurhashStep({
      key: 'blurhash-exif-preview',
      name: 'Blurhash from EXIF preview',
      files: imageFiles,
      mode: 'exif-preview',
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
  sizes,
  quality,
  mode,
  pipeline,
  concurrency = 1,
  includedInTotal,
}: {
  key: string;
  name: string;
  files: string[];
  sizes: readonly number[];
  quality: number;
  mode: ImageResizeMode;
  pipeline: ImageResizePipeline;
  concurrency?: number;
  includedInTotal?: boolean;
}): StepDefinition => ({
  key,
  name,
  includedInTotal,
  run: async () => {
    const dir = stepOutputPath(key);
    await mkdir(dir, { recursive: true });
    const runner =
      mode === 'decode-once' ? resizeImageDecodeOnce : resizeImagePerSize;
    const { failed, firstError, processed } = await mapConcurrent(
      files,
      concurrency,
      (file, index) => runner(file, index, dir, sizes, quality, pipeline),
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
        `${sizes.length} sizes`,
        `q${quality}`,
        'JPEG',
        mode === 'decode-once' ? 'decode once' : 'decode per size',
        imagePipelineDetail(pipeline),
        failed > 0 ? `${failed} failed` : null,
        failed > 0 && firstError ? `first error: ${firstError}` : null,
      ]),
    };
  },
});

const resizeImagePerSize = async (
  file: string,
  index: number,
  dir: string,
  sizes: readonly number[],
  quality: number,
  pipeline: ImageResizePipeline,
) => {
  for (const px of sizes) {
    const out = path.join(dir, `${index}-${px}.jpg`);
    const resizeOptions = {
      fit: 'inside' as const,
      withoutEnlargement: true,
    };
    const image =
      pipeline === 'legacy-metadata'
        ? openSharp(file).withMetadata().resize(px, px, resizeOptions)
        : futureOutputPolicy(
            openSharp(file).rotate().resize(px, px, resizeOptions),
            pipeline,
          );
    await image.jpeg({ quality }).toFile(out);
  }
};

const futureOutputPolicy = (
  image: ReturnType<typeof openSharp>,
  pipeline: ImageResizePipeline,
) => {
  if (pipeline === 'future-keep-icc') {
    return image.keepIccProfile();
  }
  return image.withIccProfile('srgb');
};

const imagePipelineDetail = (pipeline: ImageResizePipeline) => {
  if (pipeline === 'legacy-metadata') {
    return 'pre-R0: withMetadata, no explicit rotate';
  }
  if (pipeline === 'future-keep-icc') {
    return 'future: auto-oriented, EXIF/XMP stripped, source ICC kept';
  }
  return 'image production: auto-oriented, EXIF/XMP stripped, sRGB ICC';
};

const resizeImageDecodeOnce = async (
  file: string,
  index: number,
  dir: string,
  sizes: readonly number[],
  quality: number,
  pipeline: ImageResizePipeline,
) => {
  if (pipeline !== 'image-production-srgb') {
    throw new Error(`Decode-once is not supported for ${pipeline}`);
  }

  const { data, info } = await openSharp(file)
    .rotate()
    .toColorspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (const px of sizes) {
    const out = path.join(dir, `${index}-${px}.jpg`);
    const image = openSharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: info.channels,
      },
    })
      .resize(px, px, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .withIccProfile('srgb');
    await image.jpeg({ quality }).toFile(out);
  }
};

const blurhashStep = ({
  key,
  name,
  files,
  mode,
}: {
  key: string;
  name: string;
  files: string[];
  mode: 'full' | 'exif-preview';
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
      if (mode === 'full') {
        try {
          await encodeBlurhashFromInput(file);
          fallbackHits++;
        } catch (error) {
          failed++;
          firstError ??= errorMessage(error);
        }
        continue;
      }

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
      details:
        mode === 'full'
          ? stepDetails([
              `${fallbackHits}/${files.length} images`,
              failed > 0 ? `${failed} failed` : null,
              failed > 0 && firstError ? `first error: ${firstError}` : null,
            ])
          : stepDetails([
              `${processed}/${files.length} images`,
              `${previewHits} EXIF previews`,
              `${fallbackHits} full-decode fallbacks`,
              previewFailures > 0
                ? `${previewFailures} invalid EXIF previews`
                : null,
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

const generateVideoMontage = async (
  file: string,
  accelerated: boolean,
  stepDir: string,
  thumbnailPx: number,
) => {
  const framesDir = path.join(
    stepDir,
    accelerated ? 'video-thumbnail-frames-vaapi' : 'video-thumbnail-frames-cpu',
  );
  await mkdir(framesDir, { recursive: true });
  const { duration, width, height } = await videoInfo(file);
  if (!duration || duration <= 0) {
    throw new Error('Benchmark video has no readable duration');
  }

  const timemarks = Array.from(
    { length: 10 },
    (_, index) => (index / 10) * duration,
  );
  // Explicit, identical even dimensions for both paths so the montages match
  // and scale_vaapi (which lacks `-2` auto-sizing) gets a concrete height.
  const targetHeight =
    width && height
      ? evenHeightForWidth(thumbnailPx, width, height)
      : undefined;

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
      thumbnailPx,
      targetHeight,
      framesDir,
      'md',
    );
  } else {
    await extractCpuThumbnailFrames(
      file,
      timemarks,
      thumbnailPx,
      targetHeight,
      framesDir,
      'md',
    );
  }

  const files = Array.from({ length: 10 }, (_, index) =>
    path.join(framesDir, `md_${index + 1}.jpg`),
  );
  const image = await ji.joinImages(files, { direction: 'vertical' });
  await image.toFile(
    path.join(
      stepDir,
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

const extractCpuThumbnailFrames = async (
  source: string,
  timemarks: number[],
  width: number,
  height: number | undefined,
  framesDir: string,
  filenamePrefix: string,
) => {
  const count = timemarks.length;
  const first = timemarks[0] ?? 0;
  const splitLabels = Array.from(
    { length: count },
    (_, index) => `[s${index}]`,
  ).join('');
  const filterHeight = height ?? -2;
  const args = [
    '-y',
    '-hide_banner',
    '-ss',
    String(first),
    '-i',
    source,
    '-filter_complex',
    `[0:v]scale=w=${width}:h=${filterHeight},split=${count}${splitLabels}`,
  ];

  timemarks.forEach((time, index) => {
    args.push('-map', `[s${index}]`);
    if (index > 0) args.push('-ss', String(time - first));
    args.push(
      '-frames:v',
      '1',
      path.join(framesDir, `${filenamePrefix}_${index + 1}.jpg`),
    );
  });

  await runFfmpeg(args, { timeoutMs: benchmarkFfmpegTimeoutMs });
};

const numericProbeValue = (
  value: number | string | undefined,
): number | null => {
  if (value == null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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
      // Keep media-root containment intact by never following nested symlinks.
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
  run: (stepDir: string) => Promise<void>,
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
      await run(dir);
      return { outputDirectory: dir };
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
