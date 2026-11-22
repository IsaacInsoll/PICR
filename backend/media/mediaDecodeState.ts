import type { IPicrConfiguration } from '../config/IPicrConfiguration.js';
import { picrConfig } from '../config/picrConfig.js';
import {
  isHeicFormat,
  isJxlFormat,
  isPsbFormat,
  isPsdFormat,
  isRawFormat,
} from '@shared/imageFormats.js';

type MediaCaps = IPicrConfiguration['mediaCaps'];
type Capability = keyof MediaCaps;
export type MediaDecodeState = Partial<
  Record<Capability, { available: boolean; generation: number }>
>;

// A persisted false -> true transition permits one more attempt per file.
// Keep a generation on loss, but never downgrade existing images just for loss.
export const nextMediaDecodeState = (
  previous: MediaDecodeState | null,
  capabilities: MediaCaps,
): MediaDecodeState => {
  const next: MediaDecodeState = {};
  for (const capability of Object.keys(capabilities) as Capability[]) {
    const old = previous?.[capability];
    const generation = old?.generation ?? 0;
    const available = capabilities[capability];
    next[capability] = {
      available,
      generation: generation + (available && !old?.available ? 1 : 0),
    };
  }
  return next;
};

const capabilityFor = (name: string): Capability | undefined => {
  if (isRawFormat(name)) return 'raw';
  if (isPsdFormat(name)) return 'psd';
  if (isPsbFormat(name)) return 'psb';
  if (isHeicFormat(name)) return 'heic';
  if (isJxlFormat(name)) return 'jxl';
  return undefined;
};

export const imageDecodeAttemptKey = (name: string): string | null => {
  const capability = capabilityFor(name);
  if (!capability || !picrConfig.mediaCaps[capability]) return null;
  const generation = picrConfig.mediaDecodeState?.[capability]?.generation ?? 1;
  return `${capability}:${generation}`;
};

export const needsImagePromotion = (file: {
  name: string;
  type: string | null;
  imageDecodeAttempt: string | null;
}): boolean => {
  if (file.type !== 'File') return false;
  const key = imageDecodeAttemptKey(file.name);
  return key !== null && file.imageDecodeAttempt !== key;
};
