import type { ThumbnailSize } from '@shared/thumbnailSize.js';
import type { PicrVideoMetadata } from '@shared/types/metadata.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { log } from '../logger.js';
import * as ji from 'join-images';
import { fullPathForFile } from '../filesystem/fileManager.js';
import type { FileFields } from '../db/picrDb.js';
import { encodeThumbnail } from './encodeThumbnail.js';
import { videoPosterPath, videoScrubPath } from './videoThumbnailPaths.js';
import { runFfmpeg } from './ffmpeg.js';
import { openSharp } from './openSharp.js';
import {
  pickPosterFrame,
  type PosterFrameCandidate,
} from './pickPosterFrame.js';
import { tmpdir } from 'node:os';
import { join } from 'path';
import { encodeImageToBlurhash } from './blurHash.js';
import { db, getServerOptions } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { eq } from 'drizzle-orm';
import { videoThumbnailArtifactsExist } from './videoThumbnailExistence.js';
import { atomicWrite } from './atomicWrite.js';
import {
  serverThumbnailDimensions,
  type ServerMediaSettings,
} from '@shared/serverMediaSettings.js';
import { getServerMediaSettings } from './serverMediaSettings.js';

const numberOfVideoSnapshots = 10;

// This operation takes some time, and might be requested multiple times before it completes
// so lets queue it up
const videoThumbnailQueue: { [key: string]: Promise<void> } = {};

// NOTE: video thumbnails are generated on the CPU on purpose, even when VAAPI
// hardware acceleration is available. Benchmarking on real Intel hardware showed
// VAAPI ~16-19% SLOWER than CPU for this workload: extracting 10 seeked frames is
// dominated by GPU upload/download/init overhead rather than decode cost, so the
// GPU loses. (Whole-video transcoding is the opposite — VAAPI ~2.5-2.9x faster —
// but PICR has no transcoding workload yet.) A VAAPI thumbnail pipeline is kept in
// the admin benchmark only (see backend/media/vaapiVideo.ts) for comparison and
// in case future hardware/codecs change the calculus.

const processVideoThumbnail = async (
  file: FileFields,
  size: ThumbnailSize,
): Promise<void> => {
  if (!file.metadata) {
    throw new Error(
      `Cannot generate video thumbnails for ${file.name}: missing metadata`,
    );
  }
  const { Duration } = JSON.parse(file.metadata) as PicrVideoMetadata;
  if (!Duration || Duration <= 0 || !file.imageRatio || file.imageRatio === 0) {
    throw new Error(
      `Cannot generate video thumbnails for ${file.name}: invalid duration or image ratio (${fullPathForFile(file)})`,
    );
  }

  if (await videoThumbnailsExist(file)) {
    log('info', 'Skipping ' + file.name + ' because video thumbnails exist');
    return;
  }

  try {
    const settings = await getServerMediaSettings();
    const timestamps = frameTimestamps(Duration, numberOfVideoSnapshots);
    const tempDir = await mkdtemp(join(tmpdir(), 'picr-video-thumbnail-'));
    try {
      const candidates = await extractCandidateFrames(
        file,
        timestamps,
        tempDir,
        settings,
      );
      if (candidates.length === 0) {
        throw new Error('No candidate frames were extracted');
      }

      await mergeImages(
        candidates.map(({ path }) => path),
        videoScrubPath(file),
      );

      const selected = candidates[pickPosterFrame(candidates)];
      const posterFramePath = join(tempDir, 'poster.jpg');
      await extractPosterFrame(file, selected.timestamp, posterFramePath);
      await encodeVideoPosters(file, posterFramePath, settings);

      const blurHash = await encodeImageToBlurhash(posterFramePath);
      if (blurHash) await persistVideoBlurHash(file, blurHash);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  } catch (e) {
    log(
      'error',
      'Error generating video thumbnails for ' + file.name + ' ' + size,
    );
    log('error', String(e));
    throw e;
  }
};

interface ExtractedCandidate extends PosterFrameCandidate {
  path: string;
  timestamp: number;
}

const frameTimestamps = (duration: number, count: number): number[] =>
  Array.from(
    { length: count },
    (_, index) => ((index + 1) / (count + 2)) * duration,
  );

const extractCandidateFrames = async (
  file: FileFields,
  timestamps: number[],
  outFile: string,
  settings: ServerMediaSettings,
): Promise<ExtractedCandidate[]> => {
  const px = serverThumbnailDimensions(settings).md;
  const candidates: ExtractedCandidate[] = [];

  for (const [index, timestamp] of timestamps.entries()) {
    const outputPath = `${outFile}/md_${index + 1}.jpg`;
    await extractScaledFrame(file, timestamp, px, outputPath);
    const stats = await frameStats(outputPath);
    candidates.push({ path: outputPath, timestamp, ...stats });
  }

  return candidates;
};

const extractScaledFrame = async (
  file: FileFields,
  timestamp: number,
  px: number,
  outputPath: string,
): Promise<void> => {
  await runFfmpeg([
    '-y',
    '-ss',
    timestamp.toFixed(3),
    '-i',
    fullPathForFile(file),
    '-frames:v',
    '1',
    '-vf',
    `scale=${px}:${px}:force_original_aspect_ratio=decrease`,
    '-q:v',
    '4',
    outputPath,
  ]);
};

const extractPosterFrame = async (
  file: FileFields,
  timestamp: number,
  outputPath: string,
): Promise<void> => {
  await runFfmpeg([
    '-y',
    '-ss',
    timestamp.toFixed(3),
    '-i',
    fullPathForFile(file),
    '-frames:v',
    '1',
    '-q:v',
    '2',
    outputPath,
  ]);
};

const frameStats = async (path: string): Promise<PosterFrameCandidate> => {
  const stats = await openSharp(path).greyscale().stats();
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

const encodeVideoPosters = async (
  file: FileFields,
  posterFramePath: string,
  settings: ServerMediaSettings,
): Promise<void> => {
  await Promise.all(
    (['sm', 'md', 'lg'] as const).map((posterSize) =>
      encodeThumbnail(
        posterFramePath,
        posterSize,
        (extension) => videoPosterPath(file, posterSize, extension),
        { settings },
      ),
    ),
  );
};

const persistVideoBlurHash = async (
  file: FileFields,
  blurHash: string,
): Promise<void> => {
  file.blurHash = blurHash;
  try {
    await db
      .update(dbFile)
      .set({ blurHash, updatedAt: new Date() })
      .where(eq(dbFile.id, file.id));
  } catch (error) {
    log(
      'error',
      `Error saving video blurhash for ${file.name}: ${String(error)}`,
    );
  }
};

const videoThumbnailsExist = async (file: FileFields): Promise<boolean> => {
  const opts = await getServerOptions();
  return videoThumbnailArtifactsExist(file, opts.avifEnabled ?? false);
};

export const generateVideoThumbnail = async (
  file: FileFields,
  size: ThumbnailSize,
): Promise<void> => {
  const pr = awaitVideoThumbnailGeneration(file, size);
  if (pr) return pr;

  const key = videoThumbnailQueueKey(file);
  const p = processVideoThumbnail(file, size).finally(() => {
    delete videoThumbnailQueue[key];
  });
  videoThumbnailQueue[key] = p;
  return p;
};

export const awaitVideoThumbnailGeneration = (
  file: FileFields,
  size: ThumbnailSize,
): Promise<void> | undefined => {
  void size;
  return videoThumbnailQueue[videoThumbnailQueueKey(file)] ?? undefined;
};

const videoThumbnailQueueKey = (file: FileFields): string => String(file.id);
