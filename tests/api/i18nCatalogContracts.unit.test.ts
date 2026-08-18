import { describe, expect, it } from 'vitest';
import { dynamicGalleryCatalogPatterns } from '../../i18next.config';
import {
  authErrorCatalog,
  authErrorReasons,
} from '../../shared/auth/authErrorContract';
import { metadataDescriptions } from '../../shared/fileMetadata';
import { supportedLanguageCodes } from '../../shared/i18n/languages';
import { resources } from '../../shared/i18n/resources';

const translationAtPath = (
  catalog: unknown,
  path: readonly string[],
): unknown =>
  path.reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) return undefined;
    return Reflect.get(current, segment);
  }, catalog);

const translationLeafPaths = (
  catalog: unknown,
  prefix: readonly string[] = [],
): string[][] => {
  if (typeof catalog === 'string') return [[...prefix]];
  if (typeof catalog !== 'object' || catalog === null) return [];

  return Object.entries(catalog).flatMap(([key, value]) =>
    translationLeafPaths(value, [...prefix, key]),
  );
};

const expectNonEmptyTranslation = (
  language: (typeof supportedLanguageCodes)[number],
  path: readonly string[],
) => {
  const translation = translationAtPath(resources[language].gallery, path);
  expect(translation, `${language}:gallery:${path.join('.')}`).toEqual(
    expect.any(String),
  );
  expect(translation, `${language}:gallery:${path.join('.')}`).not.toBe('');
};

const expandedDynamicPaths = (): string[][] =>
  dynamicGalleryCatalogPatterns.flatMap((pattern) => {
    if (pattern.at(-1) !== '*') return [[...pattern]];

    const familyPath = pattern.slice(0, -1);
    const primaryFamily = translationAtPath(resources.en.gallery, familyPath);
    const leafPaths = translationLeafPaths(primaryFamily);

    expect(leafPaths, `en:gallery:${familyPath.join('.')}`).not.toHaveLength(0);
    return leafPaths.map((leafPath) => [...familyPath, ...leafPath]);
  });

describe('dynamic gallery translation contracts', () => {
  it('keeps every dynamic catalog path complete across locales', () => {
    for (const path of expandedDynamicPaths()) {
      for (const language of supportedLanguageCodes) {
        expectNonEmptyTranslation(language, path);
      }
    }
  });

  it('translates every global auth-error reason in every supported language', () => {
    const globalReasons = authErrorReasons.filter(
      (reason) =>
        authErrorCatalog[reason].globalAction === 'global_no_permissions',
    );

    for (const language of supportedLanguageCodes) {
      for (const reason of globalReasons) {
        expectNonEmptyTranslation(language, [
          'error',
          'global',
          'reason',
          reason,
        ]);
      }
    }
  });

  it('keeps metadata catalogs complete and English fallbacks synchronized', () => {
    for (const [key, englishFallback] of Object.entries(metadataDescriptions)) {
      expect(translationAtPath(resources.en.gallery, ['metadata', key])).toBe(
        englishFallback,
      );

      for (const language of supportedLanguageCodes) {
        expectNonEmptyTranslation(language, ['metadata', key]);
      }
    }
  });
});
