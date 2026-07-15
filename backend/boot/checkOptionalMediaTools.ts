import { spawnSync } from 'node:child_process';
import { picrConfig } from '../config/picrConfig.js';

type MagickFormat = 'PSD' | 'PSB' | 'HEIC' | 'HEIF';

export const checkOptionalMediaTools = () => {
  const raw = commandSucceeds(picrConfig.exiftoolPath ?? 'exiftool', ['-ver']);
  const magickResult = spawnSync(
    picrConfig.magickPath ?? 'magick',
    ['-version'],
    { encoding: 'utf8' },
  );
  const magick = !magickResult.error && magickResult.status === 0;
  if (magick) {
    // e.g. "Version: ImageMagick 7.1.1-15 Q16-HDRI ..." → "7.1.1-15"
    const match = magickResult.stdout.match(/ImageMagick (\S+)/);
    if (match) picrConfig.imageMagickVersion = match[1];
  }
  const magickFormats = magick
    ? readMagickFormats()
    : new Map<string, string>();

  picrConfig.mediaCaps = {
    raw,
    psd: formatCanRead(magickFormats, 'PSD'),
    psb: formatCanRead(magickFormats, 'PSB'),
    heic:
      formatCanRead(magickFormats, 'HEIC') ||
      formatCanRead(magickFormats, 'HEIF'),
  };
};

const commandSucceeds = (command: string, args: string[]): boolean => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return !result.error && result.status === 0;
};

const readMagickFormats = (): Map<string, string> => {
  const result = spawnSync(
    picrConfig.magickPath ?? 'magick',
    ['-list', 'format'],
    { encoding: 'utf8' },
  );
  if (result.error || result.status !== 0) return new Map();

  const formats = new Map<string, string>();
  result.stdout.split('\n').forEach((line) => {
    const match = line.trim().match(/^([A-Z0-9]+)\*?\s+\S+\s+([r-][w-][+-])/);
    if (!match) return;
    formats.set(match[1], match[2]);
  });
  return formats;
};

const formatCanRead = (
  formats: Map<string, string>,
  format: MagickFormat,
): boolean => formats.get(format)?.includes('r') ?? false;
