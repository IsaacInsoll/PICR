import { spawnSync } from 'node:child_process';
import { log } from '../logger.js';
import { picrConfig } from '../config/picrConfig.js';

type MagickFormat = 'PSD' | 'PSB' | 'HEIC' | 'HEIF';

export const checkOptionalMediaTools = () => {
  const raw = commandSucceeds(picrConfig.exiftoolPath ?? 'exiftool', ['-ver']);
  const magick = commandSucceeds(picrConfig.magickPath ?? 'magick', [
    '-version',
  ]);
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

  log(
    'info',
    [
      '🧩 Optional image decoders:',
      `RAW ${enabledLabel(picrConfig.mediaCaps.raw)}`,
      `PSD ${enabledLabel(picrConfig.mediaCaps.psd)}`,
      `PSB ${enabledLabel(picrConfig.mediaCaps.psb)}`,
      `HEIC ${enabledLabel(picrConfig.mediaCaps.heic)}`,
    ].join(' '),
    true,
  );
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

const enabledLabel = (enabled: boolean): string =>
  enabled ? 'enabled' : 'disabled';
