import { spawn } from 'node:child_process';
import { picrConfig } from '../config/picrConfig.js';

const defaultTimeoutMs = 60_000;

export interface RunMediaCommandOptions {
  timeoutMs?: number;
}

export interface RunMediaCommandResult {
  stdout: string;
  stderr: string;
}

export interface FfprobeFormat {
  bit_rate?: number | string;
  duration?: number | string;
  format_long_name?: string;
}

export interface FfprobeStream {
  codec_name?: string;
  codec_long_name?: string;
  codec_type?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  tags?: Record<string, string | undefined>;
  side_data_list?: Array<{
    side_data_type?: string;
    rotation?: number | string;
  }>;
}

export interface FfprobeData {
  format: FfprobeFormat;
  streams: FfprobeStream[];
}

export const runFfmpeg = (
  args: string[],
  options?: RunMediaCommandOptions,
): Promise<RunMediaCommandResult> =>
  runMediaCommand(picrConfig.ffmpegPath ?? 'ffmpeg', args, options);

export const runFfprobe = (
  args: string[],
  options?: RunMediaCommandOptions,
): Promise<RunMediaCommandResult> =>
  runMediaCommand(picrConfig.ffprobePath ?? 'ffprobe', args, options);

export const probe = async (
  path: string,
  options?: RunMediaCommandOptions,
): Promise<FfprobeData> => {
  const { stdout } = await runFfprobe(
    [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      path,
    ],
    options,
  );
  const parsed = JSON.parse(stdout) as Partial<FfprobeData>;
  return {
    format: parsed.format ?? {},
    streams: parsed.streams ?? [],
  };
};

const runMediaCommand = (
  command: string,
  args: string[],
  options?: RunMediaCommandOptions,
): Promise<RunMediaCommandResult> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, options?.timeoutMs ?? defaultTimeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const detail = stderr.trim() || stdout.trim();
      reject(
        new Error(
          timedOut
            ? `${command} timed out after ${options?.timeoutMs ?? defaultTimeoutMs}ms`
            : `${command} exited with ${code ?? signal ?? 'unknown'}${detail ? `: ${detail}` : ''}`,
        ),
      );
    });
  });
};
