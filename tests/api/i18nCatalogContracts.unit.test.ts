import { describe, expect, it } from 'vitest';
import { dynamicCatalogPatterns } from '../../i18next.config';
import {
  authErrorCatalog,
  authErrorReasons,
} from '../../shared/auth/authErrorContract';
import { metadataDescriptions } from '../../shared/fileMetadata';
import {
  fontCategoryLabels,
  fontHeadingOnlyLabel,
  fontRegistry,
  fontSuitabilityLabels,
} from '../../shared/branding/fontRegistry';
import { supportedLanguageCodes } from '../../shared/i18n/languages';
import {
  namespaces,
  resources,
  type TranslationNamespace,
} from '../../shared/i18n/resources';

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
  namespace: TranslationNamespace,
  path: readonly string[],
) => {
  const translation = translationAtPath(resources[language][namespace], path);
  expect(translation, `${language}:${namespace}:${path.join('.')}`).toEqual(
    expect.any(String),
  );
  expect(translation, `${language}:${namespace}:${path.join('.')}`).not.toBe(
    '',
  );
};

interface DynamicCatalogPath {
  namespace: TranslationNamespace;
  path: string[];
}

const expandedDynamicPaths = (): DynamicCatalogPath[] =>
  namespaces.flatMap((namespace) =>
    dynamicCatalogPatterns[namespace].flatMap((pattern) => {
      if (pattern.at(-1) !== '*') {
        return [{ namespace, path: [...pattern] }];
      }

      const familyPath = pattern.slice(0, -1);
      const primaryFamily = translationAtPath(
        resources.en[namespace],
        familyPath,
      );
      const leafPaths = translationLeafPaths(primaryFamily);

      expect(
        leafPaths,
        `en:${namespace}:${familyPath.join('.')}`,
      ).not.toHaveLength(0);
      return leafPaths.map((leafPath) => ({
        namespace,
        path: [...familyPath, ...leafPath],
      }));
    }),
  );

describe('dynamic translation contracts', () => {
  it('keeps every dynamic catalog path complete across locales', () => {
    for (const { namespace, path } of expandedDynamicPaths()) {
      for (const language of supportedLanguageCodes) {
        expectNonEmptyTranslation(language, namespace, path);
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
        expectNonEmptyTranslation(language, 'gallery', [
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
        expectNonEmptyTranslation(language, 'gallery', ['metadata', key]);
      }
    }
  });

  it('keeps font presentation catalogs complete and English fallbacks synchronized', () => {
    for (const font of fontRegistry) {
      expect(
        translationAtPath(resources.en.admin, [
          'font',
          'description',
          font.key,
        ]),
      ).toBe(font.description);

      for (const language of supportedLanguageCodes) {
        expectNonEmptyTranslation(language, 'admin', [
          'font',
          'description',
          font.key,
        ]);
      }
    }

    for (const [key, englishFallback] of Object.entries(fontCategoryLabels)) {
      expect(
        translationAtPath(resources.en.admin, ['font', 'category', key]),
      ).toBe(englishFallback);

      for (const language of supportedLanguageCodes) {
        expectNonEmptyTranslation(language, 'admin', ['font', 'category', key]);
      }
    }

    for (const [key, englishFallback] of Object.entries(
      fontSuitabilityLabels,
    )) {
      expect(
        translationAtPath(resources.en.admin, ['font', 'suitability', key]),
      ).toBe(englishFallback);

      for (const language of supportedLanguageCodes) {
        expectNonEmptyTranslation(language, 'admin', [
          'font',
          'suitability',
          key,
        ]);
      }
    }

    expect(translationAtPath(resources.en.admin, ['font', 'headingOnly'])).toBe(
      fontHeadingOnlyLabel,
    );
    for (const language of supportedLanguageCodes) {
      expectNonEmptyTranslation(language, 'admin', ['font', 'headingOnly']);
    }
  });
});
