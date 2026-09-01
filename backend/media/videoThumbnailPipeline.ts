import * as ji from 'join-images';
import { access, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path, { join } from 'node:path';
import type { ThumbnailVariant } from '@shared/thumbnailVariants.js';
import { log } from '../logger.js';
import { atomicWrite } from './atomicWrite.js';
import { encodeImageToBlurhash } from './blurHash.js';
import { encodeImageThumbnailVariants } from './encodeImageThumbnails.js';
import { runFfmpeg } from './ffmpeg.js';
import { openSharp } from './openSharp.js';
import {
  pickPosterFrame,
  type PosterFrameCandidate,
} from './pickPosterFrame.js';

export const numberOfVideoSnapshots = 10;

// Split extraction is O(video duration): ffmpeg decodes from the first timestamp
// to the last. Measurements crossed over around a one-minute 1080p H.264 clip,
// while 45s clips still favored split for both 1080p and 4K H.264. Keep it
// guarded and fallback-backed so slower hardware/codecs self-correct.
export const splitVideoThumbnailMaxDurationSeconds = 45;

const splitExtractionTimeoutMs = (duration: number): number =>
  Math.max(15_000, Math.ceil(duration * 1_500));
const seekExtractionTimeoutMs = 90_000;

interface ExtractedCandidate extends PosterFrameCandidate {
  path: string;
  timestamp: number;
}

export interface GenerateVideoThumbnailArtifactsOptions {
  sourcePath: string;
  duration: number;
  thumbnailPx: number;
  scrubPath: string;
  posterFramePath: string;
  variants: readonly ThumbnailVariant[];
  posterVariantPath: (variant: ThumbnailVariant) => string;
  extractCandidateFrames?: (
    sourcePath: string,
    duration: number,
    timestamps: readonly number[],
    thumbnailPx: number,
    framesDir: string,
  ) => Promise<VideoCandidateExtractionResult>;
}

export interface GeneratedVideoThumbnailArtifacts {
  blurHash: string;
  candidateExtractionMethod: VideoCandidateExtractionMethod;
}

export type VideoCandidateExtractionMethod =
  | 'split'
  | 'seek-loop'
  | 'vaapi-split';

export interface VideoCandidateExtractionResult {
  method: VideoCandidateExtractionMethod;
}

export const videoFrameTimestamps = (
  duration: number,
  count: number = numberOfVideoSnapshots,
): number[] =>
  Array.from(
    { length: count },
    (_, index) => ((index + 1) / (count + 2)) * duration,
  );

export const generateVideoThumbnailArtifacts = async ({
  sourcePath,
  duration,
  thumbnailPx,
  scrubPath,
  posterFramePath,
  variants,
  posterVariantPath,
  extractCandidateFrames = extractCpuCandidateFrames,
}: GenerateVideoThumbnailArtifactsOptions): Promise<GeneratedVideoThumbnailArtifacts> => {
  const timestamps = videoFrameTimestamps(duration, numberOfVideoSnapshots);
  const tempDir = await mkdtemp(join(tmpdir(), 'picr-video-thumbnail-'));
  try {
    const { candidates, method } = await extractCandidates(
      sourcePath,
      duration,
      timestamps,
      thumbnailPx,
      tempDir,
      extractCandidateFrames,
    );
    if (candidates.length === 0) {
      throw new Error('No candidate frames were extracted');
    }

    await mergeImages(
      candidates.map(({ path }) => path),
      scrubPath,
    );

    const selected = candidates[pickPosterFrame(candidates)];
    const tempPosterFramePath = join(tempDir, 'poster.jpg');
    await extractPosterFrame(
      sourcePath,
      selected.timestamp,
      tempPosterFramePath,
    );
    await atomicWrite(posterFramePath, (tempPath) =>
      copyFile(tempPosterFramePath, tempPath),
    );
    await encodeVideoPosterVariants(
      posterFramePath,
      variants,
      posterVariantPath,
    );

    return {
      blurHash: await encodeImageToBlurhash(posterFramePath),
      candidateExtractionMethod: method,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

const extractCandidates = async (
  sourcePath: string,
  duration: number,
  timestamps: readonly number[],
  thumbnailPx: number,
  tempDir: string,
  extractCandidateFrames: (
    sourcePath: string,
    duration: number,
    timestamps: readonly number[],
    thumbnailPx: number,
    framesDir: string,
  ) => Promise<VideoCandidateExtractionResult>,
): Promise<{
  candidates: ExtractedCandidate[];
  method: VideoCandidateExtractionMethod;
}> => {
  let { method } = await extractCandidateFrames(
    sourcePath,
    duration,
    timestamps,
    thumbnailPx,
    tempDir,
  );
  let missingFrames = await missingCandidateFrames(tempDir, timestamps.length);
  if (method === 'split' && missingFrames.length > 0) {
    log(
      'info',
      `Video thumbnail split extraction wrote ${timestamps.length - missingFrames.length}/${timestamps.length} candidate frames for ${sourcePath}; falling back to seek loop`,
    );
    await extractSeekCpuThumbnailFrames(
      sourcePath,
      timestamps,
      thumbnailPx,
      thumbnailPx,
      tempDir,
      'md',
    );
    method = 'seek-loop';
    missingFrames = await missingCandidateFrames(tempDir, timestamps.length);
  }
  if (missingFrames.length > 0) {
    throw new Error(
      `Video thumbnail extraction wrote ${timestamps.length - missingFrames.length}/${timestamps.length} candidate frames using ${method}; missing ${missingFrames.join(', ')}`,
    );
  }

  const candidates = await Promise.all(
    timestamps.map(async (timestamp, index) => {
      const candidatePath = path.join(tempDir, candidateFrameName(index));
      const stats = await frameStats(candidatePath);
      return { path: candidatePath, timestamp, ...stats };
    }),
  );
  return { candidates, method };
};

export const extractCpuCandidateFrames = async (
  sourcePath: string,
  duration: number,
  timestamps: readonly number[],
  thumbnailPx: number,
  framesDir: string,
): Promise<VideoCandidateExtractionResult> => {
  if (duration <= splitVideoThumbnailMaxDurationSeconds) {
    try {
      await extractSplitCpuThumbnailFrames(
        sourcePath,
        timestamps,
        thumbnailPx,
        thumbnailPx,
        framesDir,
        'md',
        splitExtractionTimeoutMs(duration),
      );
      return { method: 'split' };
    } catch (error) {
      log(
        'info',
        `Video thumbnail split extraction failed for ${sourcePath}; falling back to seek loop: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  await extractSeekCpuThumbnailFrames(
    sourcePath,
    timestamps,
    thumbnailPx,
    thumbnailPx,
    framesDir,
    'md',
  );
  return { method: 'seek-loop' };
};

export const extractSplitCpuThumbnailFrames = async (
  source: string,
  timestamps: readonly number[],
  width: number,
  height: number | undefined,
  framesDir: string,
  filenamePrefix: string,
  timeoutMs: number,
): Promise<void> => {
  const count = timestamps.length;
  if (count === 0) return;

  const first = timestamps[0] ?? 0;
  const splitLabels = Array.from(
    { length: count },
    (_, index) => `[s${index}]`,
  ).join('');
  const filterHeight = height ?? -2;
  const scaleFilter =
    height == null
      ? `scale=w=${width}:h=${filterHeight}`
      : `scale=w=${width}:h=${filterHeight}:force_original_aspect_ratio=decrease`;
  const args = [
    '-y',
    '-hide_banner',
    '-ss',
    String(first),
    '-i',
    source,
    '-filter_complex',
    `[0:v]${scaleFilter},split=${count}${splitLabels}`,
  ];

  timestamps.forEach((time, index) => {
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

  await runFfmpeg(args, { timeoutMs });
};

const extractSeekCpuThumbnailFrames = async (
  sourcePath: string,
  timestamps: readonly number[],
  width: number,
  height: number,
  framesDir: string,
  filenamePrefix: string,
): Promise<void> => {
  for (const [index, timestamp] of timestamps.entries()) {
    await runFfmpeg(
      [
        '-y',
        '-ss',
        timestamp.toFixed(3),
        '-i',
        sourcePath,
        '-frames:v',
        '1',
        '-vf',
        `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
        '-q:v',
        '4',
        path.join(framesDir, `${filenamePrefix}_${index + 1}.jpg`),
      ],
      { timeoutMs: seekExtractionTimeoutMs },
    );
  }
};

const candidateFrameName = (index: number): string => `md_${index + 1}.jpg`;

const missingCandidateFrames = async (
  framesDir: string,
  count: number,
): Promise<string[]> => {
  const results = await Promise.all(
    Array.from({ length: count }, async (_, index) => {
      const name = candidateFrameName(index);
      try {
        await access(path.join(framesDir, name));
        return null;
      } catch {
        return name;
      }
    }),
  );
  return results.filter((name): name is string => name !== null);
};

const extractPosterFrame = async (
  sourcePath: string,
  timestamp: number,
  outputPath: string,
): Promise<void> => {
  await runFfmpeg([
    '-y',
    '-ss',
    timestamp.toFixed(3),
    '-i',
    sourcePath,
    '-frames:v',
    '1',
    '-q:v',
    '2',
    outputPath,
  ]);
};

const frameStats = async (filePath: string): Promise<PosterFrameCandidate> => {
  const stats = await openSharp(filePath).greyscale().stats();
  const channel = stats.channels[0];
  return {
    lumaMean: channel.mean,
    lumaStdev: channel.stdev,
  };
};

const mergeImages = async (files: string[], outputPath: string) => {
  const img = await ji.joinImages(files, { direction: 'vertical' });
  await atomicWrite(outputPath, (tempPath) => img.toFile(tempPath));
};

const encodeVideoPosterVariants = async (
  posterFramePath: string,
  variants: readonly ThumbnailVariant[],
  posterVariantPath: (variant: ThumbnailVariant) => string,
): Promise<void> => {
  if (variants.length === 0) return;

  await encodeImageThumbnailVariants(
    posterFramePath,
    variants,
    posterVariantPath,
  );
};
