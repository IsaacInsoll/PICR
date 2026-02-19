import * as Font from 'expo-font';
import {
  FontKey,
  normalizeFontKey as normalizeHeadingFontKey,
} from '@shared/branding/fontRegistry';
import { fontFiles, fontWeightsByKey } from '@/src/fonts.generated';

export { normalizeHeadingFontKey };

export type TitleLevel = 1 | 2 | 3 | 4;

// Track which fonts we've attempted to load this session.
// Note: During hot reload in dev, this resets but fonts remain loaded in Expo.
// The loadHeadingFont function handles this gracefully.
const loadedFontKeys = new Set<FontKey>(['default', 'signika']);

const resolveAssetKey = (key: FontKey) => (key === 'default' ? 'signika' : key);

const getWeightForLevel = (weights: readonly number[], level: TitleLevel) => {
  const sorted = [...weights].sort((a, b) => a - b);
  const maxIndex = sorted.length - 1;
  if (maxIndex <= 0) return sorted[0] ?? 400;

  switch (level) {
    case 1:
      return sorted[maxIndex];
    case 2:
      return sorted[Math.max(maxIndex - 1, 0)];
    case 3:
      return sorted[Math.floor(maxIndex / 2)];
    case 4:
      return sorted[0];
  }
};

export const getHeadingFontFamilyForLevel = (
  key: FontKey,
  level: TitleLevel,
) => {
  const resolvedKey = resolveAssetKey(key);
  const weights = fontWeightsByKey[resolvedKey] ??
    fontWeightsByKey.default ?? [400];
  const weight = getWeightForLevel(weights, level);
  const familyKey = `${resolvedKey}-${weight}`;
  return familyKey in fontFiles ? familyKey : 'signika-400';
};

export const getFontFilesForKey = (key: FontKey) => {
  const resolvedKey = resolveAssetKey(key);
  const weights = fontWeightsByKey[resolvedKey] ??
    fontWeightsByKey.default ?? [400];
  return weights.reduce<Record<string, number>>((acc, weight) => {
    const familyKey = `${resolvedKey}-${weight}`;
    const file = fontFiles[familyKey as keyof typeof fontFiles];
    if (file) {
      acc[familyKey] = file;
    }
    return acc;
  }, {});
};

export const loadHeadingFont = async (key: FontKey): Promise<void> => {
  if (loadedFontKeys.has(key)) return;

  const files = getFontFilesForKey(key);
  if (Object.keys(files).length === 0) return;

  // Filter out fonts that are already loaded (handles hot reload scenarios)
  const unloadedFiles = Object.fromEntries(
    Object.entries(files).filter(([name]) => !Font.isLoaded(name)),
  );

  if (Object.keys(unloadedFiles).length > 0) {
    await Font.loadAsync(unloadedFiles);
  }

  loadedFontKeys.add(key);
};

export const isHeadingFontLoaded = (key: FontKey): boolean =>
  loadedFontKeys.has(key);

export const getBaseFontFiles = () => {
  return {
    ...getFontFilesForKey('default'),
    'roboto-400': fontFiles['roboto-400'],
    'roboto-500': fontFiles['roboto-500'],
    'roboto-700': fontFiles['roboto-700'],
  };
};
