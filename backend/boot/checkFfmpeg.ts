import { spawnSync } from 'node:child_process';
import { picrConfig } from '../config/picrConfig.js';

type BinaryCheck = {
  name: 'ffmpeg' | 'ffprobe';
  command: string;
};

const binaryChecks: BinaryCheck[] = [
  {
    name: 'ffmpeg',
    command: picrConfig.ffmpegPath ?? 'ffmpeg',
  },
  {
    name: 'ffprobe',
    command: picrConfig.ffprobePath ?? 'ffprobe',
  },
];

const failureMessage = (
  { name, command }: BinaryCheck,
  reason: string,
): string => {
  return [
    `⚠️ Required media binary '${name}' is not available.`,
    `PICR needs both ffmpeg and ffprobe at startup for video metadata and thumbnail generation.`,
    `Checked command: ${command}`,
    reason,
    `Install ffmpeg so both binaries are on PATH, or set ${name === 'ffmpeg' ? 'FFMPEG_PATH' : 'FFPROBE_PATH'} in your environment.`,
    'See docs/development/initial-setup.md for development setup guidance.',
  ].join('\n');
};

export const checkFfmpeg = () => {
  for (const check of binaryChecks) {
    const result = spawnSync(check.command, ['-version'], {
      encoding: 'utf8',
    });

    if (result.error) {
      process.stderr.write(
        failureMessage(check, `Resolution error: ${result.error.message}`) +
          '\n',
      );
      process.exit(1);
    }

    if (result.status !== 0) {
      const stderr = result.stderr.trim();
      const stdout = result.stdout.trim();
      const details = stderr || stdout || `Exited with status ${result.status}`;
      process.stderr.write(failureMessage(check, details) + '\n');
      process.exit(1);
    }
  }
};
