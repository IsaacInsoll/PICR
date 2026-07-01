import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { dirname } from 'path';
import { pipeline } from 'node:stream/promises';
import type { FileFields } from '../db/picrDb.js';
import { fullPathForFile } from '../filesystem/fileManager.js';
import { log } from '../logger.js';
import { picrConfig } from '../config/picrConfig.js';
import { decodedImagePath } from './decodedImagePath.js';
import { decoderFor, type ImageDecoder } from './decoderFor.js';
import { openSharp } from './openSharp.js';

const decodeTimeoutMs = 30_000;
const inFlightDecodes = new Map<string, Promise<string>>();
const reportedFailures = new Set<string>();

const rawPreviewTags = [
  'JpgFromRaw',
  'PreviewImage',
  'ThumbnailImage',
] as const;

export const ensureDecodedImage = async (file: FileFields): Promise<string> => {
  const decoder = decoderFor(file);
  if (decoder === 'none') return fullPathForFile(file);

  const target = decodedImagePath(file);
  if (existsSync(target)) return target;

  const failureKey = decodeFailureKey(file, decoder);
  if (reportedFailures.has(failureKey)) {
    throw new Error(`Previous ${decoder} decode failure for ${file.name}`);
  }

  const inFlightKey = `${file.id}-${file.fileHash ?? ''}`;
  const existing = inFlightDecodes.get(inFlightKey);
  if (existing) return existing;

  const promise = decodeImage(file, decoder, target).finally(() => {
    inFlightDecodes.delete(inFlightKey);
  });
  inFlightDecodes.set(inFlightKey, promise);
  return promise;
};

const decodeImage = async (
  file: FileFields,
  decoder: Exclude<ImageDecoder, 'none'>,
  target: string,
): Promise<string> => {
  try {
    await mkdir(dirname(target), { recursive: true });
    if (decoder === 'exiftool') {
      await decodeRawPreview(file, target);
    } else {
      await decodeWithMagick(file, target);
    }
    return target;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failureKey = decodeFailureKey(file, decoder);
    if (!reportedFailures.has(failureKey)) {
      reportedFailures.add(failureKey);
      log('error', `Unable to decode ${file.name} with ${decoder}: ${message}`);
    }
    throw error;
  }
};

const decodeRawPreview = async (
  file: FileFields,
  target: string,
): Promise<void> => {
  const source = fullPathForFile(file);
  let lastError: unknown = null;

  for (const [index, tag] of rawPreviewTags.entries()) {
    const candidate = tempPath(target, index);
    await removeIfExists(candidate);
    try {
      await runProcessToFile(
        picrConfig.exiftoolPath ?? 'exiftool',
        ['-b', `-${tag}`, source],
        candidate,
      );
      await validateCandidate(candidate);
      await rename(candidate, target);
      return;
    } catch (error) {
      lastError = error;
      await removeIfExists(candidate);
    }
  }

  throw new Error(
    `No usable embedded RAW preview found: ${String(lastError ?? 'unknown error')}`,
  );
};

const decodeWithMagick = async (
  file: FileFields,
  target: string,
): Promise<void> => {
  const candidate = tempPath(target, 0);
  await removeIfExists(candidate);
  try {
    await runProcess(picrConfig.magickPath ?? 'magick', [
      `${fullPathForFile(file)}[0]`,
      '-auto-orient',
      // Force sRGB so CMYK PSDs don't yield a CMYK JPEG (wrong colours downstream)
      '-colorspace',
      'sRGB',
      candidate,
    ]);
    await validateCandidate(candidate);
    await rename(candidate, target);
  } catch (error) {
    await removeIfExists(candidate);
    throw error;
  }
};

const validateCandidate = async (path: string): Promise<void> => {
  const candidateStat = await stat(path);
  if (candidateStat.size <= 0) {
    throw new Error('decoded image output was empty');
  }

  const metadata = await openSharp(path).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('decoded image output had no dimensions');
  }
};

const runProcessToFile = async (
  command: string,
  args: string[],
  outputPath: string,
): Promise<void> => {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const stderr = collectStderr(child.stderr);
  const pipePromise = pipeline(child.stdout, createWriteStream(outputPath));
  const exitPromise = waitForExit(child, command, stderr);
  await Promise.all([pipePromise, exitPromise]);
};

const runProcess = async (command: string, args: string[]): Promise<void> => {
  const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const stderr = collectStderr(child.stderr);
  await waitForExit(child, command, stderr);
};

const waitForExit = (
  child: ReturnType<typeof spawn>,
  command: string,
  stderr: () => string,
): Promise<void> =>
  new Promise((resolve, reject) => {
    let settled = false;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, decodeTimeoutMs);

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };

    child.on('error', (error) => finish(error));
    child.on('close', (code, signal) => {
      if (timedOut) {
        finish(new Error(`${command} timed out after ${decodeTimeoutMs}ms`));
        return;
      }
      if (code !== 0) {
        const details =
          stderr() ||
          `Exited with status ${String(code)} signal ${signal ?? ''}`;
        finish(new Error(`${command} failed: ${details}`));
        return;
      }
      finish();
    });
  });

const collectStderr = (stream: NodeJS.ReadableStream): (() => string) => {
  const chunks: string[] = [];
  let total = 0;
  stream.on('data', (chunk: Buffer | string) => {
    if (total > 8_000) return;
    const next = chunk.toString();
    total += next.length;
    chunks.push(next);
  });
  return () => chunks.join('').trim();
};

const tempPath = (target: string, attempt: number): string =>
  `${target}.${process.pid}.${Date.now()}.${attempt}.tmp.jpg`;

const removeIfExists = async (path: string): Promise<void> => {
  await rm(path, { force: true });
};

const decodeFailureKey = (
  file: FileFields,
  decoder: Exclude<ImageDecoder, 'none'>,
): string => `${file.id}-${file.fileHash ?? ''}-${decoder}`;
