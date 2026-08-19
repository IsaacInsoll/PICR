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
import { SOCIAL_LINK_TYPES } from '../../shared/branding/socialLinkTypes';
import { badChars } from '../../shared/badChars';
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

interface TranslationValueContract {
  interpolations: string[];
  templates: string[];
  tags: string[];
}

interface TranslationValueContractOverride {
  omittedInterpolations?: readonly string[];
  addedInterpolations?: readonly string[];
  omittedTemplates?: readonly string[];
  addedTemplates?: readonly string[];
  omittedTags?: readonly string[];
  addedTags?: readonly string[];
}

const translationValueContractOverrides: Readonly<
  Record<string, TranslationValueContractOverride>
> = {
  // French singular naturally means "showing the largest [file]"; inserting
  // the supplied limit of 1 would make the sentence less idiomatic.
  'fr:admin:server.storage.fileLimit_one': {
    omittedInterpolations: ['limit'],
  },
};

const i18nextInterpolationPattern = /\{\{\s*(-?\s*[^{}]+?)\s*\}\}/gu;
const thirdPartyTemplatePattern = /\{([^{}\s]+)\}/gu;
const componentTagPattern =
  /<(\/)?([A-Za-z][\w-]*|\d+)(?:\s[^>]*?)?\s*(\/?)>/gu;
const pluralSuffixPattern = /_(?:zero|one|two|few|many|other)$/u;
const englishPluralFallbackSuffixes = [
  'other',
  'one',
  'zero',
  'two',
  'few',
  'many',
] as const;

const sorted = (values: Iterable<string>): string[] => [...values].sort();

const omitContractTokens = (
  tokens: readonly string[],
  omissions: readonly string[] | undefined,
  context: string,
): string[] => {
  const remaining = [...tokens];
  for (const omission of omissions ?? []) {
    const index = remaining.indexOf(omission);
    if (index < 0) {
      throw new Error(
        `${context}: contract override omits absent token ${omission}`,
      );
    }
    remaining.splice(index, 1);
  }
  return remaining;
};

const overrideContractTokens = (
  tokens: readonly string[],
  omissions: readonly string[] | undefined,
  additions: readonly string[] | undefined,
  context: string,
): string[] =>
  sorted([
    ...omitContractTokens(tokens, omissions, context),
    ...(additions ?? []),
  ]);

const applyTranslationValueContractOverride = (
  source: TranslationValueContract,
  override: TranslationValueContractOverride | undefined,
  context: string,
): TranslationValueContract => ({
  interpolations: overrideContractTokens(
    source.interpolations,
    override?.omittedInterpolations,
    override?.addedInterpolations,
    context,
  ),
  templates: overrideContractTokens(
    source.templates,
    override?.omittedTemplates,
    override?.addedTemplates,
    context,
  ),
  tags: overrideContractTokens(
    source.tags,
    override?.omittedTags,
    override?.addedTags,
    context,
  ),
});

const translationValueContract = (
  value: string,
  context = 'translation value',
): TranslationValueContract => {
  const interpolations = [...value.matchAll(i18nextInterpolationPattern)].map(
    ([, expression]) =>
      expression.split(',', 1)[0].trim().replace(/^-\s*/u, ''),
  );
  const withoutInterpolations = value.replace(i18nextInterpolationPattern, '');
  const templates = [
    ...withoutInterpolations.matchAll(thirdPartyTemplatePattern),
  ].map(([, token]) => token);
  const tags: string[] = [];
  const openTags: string[] = [];
  for (const [, closing, name, selfClosing] of value.matchAll(
    componentTagPattern,
  )) {
    if (selfClosing) {
      tags.push(`${name}/`);
      continue;
    }
    if (!closing) {
      openTags.push(name);
      tags.push(name);
      continue;
    }

    const opened = openTags.pop();
    if (opened !== name) {
      throw new Error(
        `${context}: unbalanced component tag; expected </${opened ?? 'none'}>, received </${name}>`,
      );
    }
    tags.push(`/${name}`);
  }
  if (openTags.length > 0) {
    throw new Error(
      `${context}: unclosed component tag${openTags.length === 1 ? '' : 's'}: ${openTags.join(', ')}`,
    );
  }

  return {
    interpolations: sorted(interpolations),
    templates: sorted(templates),
    tags: sorted(tags),
  };
};

const englishValueForTranslatedPath = (
  namespace: TranslationNamespace,
  path: readonly string[],
): string | undefined => {
  const exactValue = translationAtPath(resources.en[namespace], path);
  if (typeof exactValue === 'string') return exactValue;

  const key = path.at(-1);
  if (!key || !pluralSuffixPattern.test(key)) return undefined;

  const baseKey = key.replace(pluralSuffixPattern, '');
  for (const suffix of englishPluralFallbackSuffixes) {
    const fallbackValue = translationAtPath(resources.en[namespace], [
      ...path.slice(0, -1),
      `${baseKey}_${suffix}`,
    ]);
    if (typeof fallbackValue === 'string') return fallbackValue;
  }

  return undefined;
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

const stringTranslationAtPath = (
  language: (typeof supportedLanguageCodes)[number],
  namespace: TranslationNamespace,
  path: readonly string[],
): string => {
  const value = translationAtPath(resources[language][namespace], path);
  if (typeof value !== 'string') {
    throw new Error(`${language}:${namespace}:${path.join('.')} is not text`);
  }
  return value;
};

const isReservedExampleHostname = (hostname: string): boolean =>
  hostname === 'example.com' || hostname.endsWith('.example');

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

  it('keeps social-link selector labels complete without changing persisted defaults', () => {
    for (const definition of SOCIAL_LINK_TYPES) {
      expect(
        translationAtPath(resources.en.admin, [
          'branding',
          'socialType',
          definition.key,
        ]),
      ).toBe(definition.defaultTitle);

      for (const language of supportedLanguageCodes) {
        expectNonEmptyTranslation(language, 'admin', [
          'branding',
          'socialType',
          definition.key,
        ]);
      }
    }
  });
});

describe('translated format examples', () => {
  it('keeps public-link ID examples valid for the field', () => {
    for (const language of supportedLanguageCodes) {
      const example = stringTranslationAtPath(language, 'admin', [
        'links',
        'editor',
        'idPlaceholder',
      ]);
      expect(badChars(example), `${language}: invalid link-ID example`).toEqual(
        [],
      );
      expect(
        example.length,
        `${language}: link-ID example must satisfy the field minimum`,
      ).toBeGreaterThanOrEqual(6);
    }
  });

  it('uses reserved domains for inert URL and email examples', () => {
    const urlPaths = [
      ['branding', 'form', 'logoUrlPlaceholder'],
      ['branding', 'form', 'websiteUrlPlaceholder'],
      ['branding', 'socialPlaceholder', 'website'],
    ] as const;

    for (const language of supportedLanguageCodes) {
      for (const path of urlPaths) {
        const example = stringTranslationAtPath(language, 'admin', path);
        expect(
          isReservedExampleHostname(new URL(example).hostname),
          `${language}:admin:${path.join('.')}`,
        ).toBe(true);
      }

      const userEmailExample = stringTranslationAtPath(language, 'admin', [
        'users',
        'editor',
        'emailPlaceholder',
      ]);
      const socialEmailExample = stringTranslationAtPath(language, 'admin', [
        'branding',
        'socialPlaceholder',
        'email',
      ]);
      expect(userEmailExample).toMatch(/(?:^|\s)[^@\s]+@example\.com(?:\s|$)/u);
      expect(socialEmailExample).toMatch(/^[^@\s]+@example\.com$/u);
    }
  });
});

describe('translation value contracts', () => {
  it('extracts interpolation, third-party template, and component-tag contracts', () => {
    expect(
      translationValueContract(
        '<strong>{{folder}}</strong>: {index}/{total} {{folder}} <code>{{- value}}</code>',
      ),
    ).toEqual({
      interpolations: ['folder', 'folder', 'value'],
      templates: ['index', 'total'],
      tags: ['/code', '/strong', 'code', 'strong'],
    });
  });

  it('allows translated prose to reorder an unchanged runtime contract', () => {
    expect(
      translationValueContract(
        '<code>{{branding}}</code> για τον φάκελο <strong>{{folder}}</strong>',
      ),
    ).toEqual(
      translationValueContract(
        '<strong>{{folder}}</strong> uses <code>{{branding}}</code>',
      ),
    );
  });

  it.each([
    ['a missing interpolation', '<strong>folder</strong>: {index} of {total}'],
    [
      'a renamed interpolation',
      '<strong>{{φάκελος}}</strong>: {index} of {total}',
    ],
    ['a missing third-party template', '<strong>{{folder}}</strong>: {index}'],
    [
      'a changed component tag',
      '<emphasis>{{folder}}</emphasis>: {index} of {total}',
    ],
  ])('detects %s', (_, translatedValue) => {
    expect(translationValueContract(translatedValue)).not.toEqual(
      translationValueContract(
        '<strong>{{folder}}</strong>: {index} of {total}',
      ),
    );
  });

  it('applies explicit additions and omissions as deltas to the source contract', () => {
    const source = translationValueContract(
      '<strong>{{folder}}</strong>: {index} of {total}',
    );

    expect(
      applyTranslationValueContractOverride(
        source,
        {
          omittedInterpolations: ['folder'],
          omittedTemplates: ['total'],
          omittedTags: ['strong', '/strong'],
          addedInterpolations: ['count'],
          addedTemplates: ['page'],
          addedTags: ['emphasis', '/emphasis'],
        },
        'test override',
      ),
    ).toEqual({
      interpolations: ['count'],
      templates: ['index', 'page'],
      tags: ['/emphasis', 'emphasis'],
    });
  });

  it('rejects unbalanced component markup', () => {
    expect(() =>
      translationValueContract('<strong><code>Text</strong></code>'),
    ).toThrow('unbalanced component tag');
  });

  it('uses the English plural family for a target-only plural category', () => {
    expect(
      englishValueForTranslatedPath('gallery', ['count', 'file_few']),
    ).toBe(resources.en.gallery.count.file_other);
  });

  it('preserves runtime value contracts across every translated catalog', () => {
    const usedOverrides = new Set<string>();

    for (const language of supportedLanguageCodes) {
      if (language === 'en') continue;

      for (const namespace of namespaces) {
        for (const path of translationLeafPaths(
          resources[language][namespace],
        )) {
          const translatedValue = translationAtPath(
            resources[language][namespace],
            path,
          );
          const englishValue = englishValueForTranslatedPath(namespace, path);
          const catalogPath = `${language}:${namespace}:${path.join('.')}`;

          expect(translatedValue, catalogPath).toEqual(expect.any(String));
          expect(
            englishValue,
            `${catalogPath} has no English source template`,
          ).toEqual(expect.any(String));
          if (
            typeof translatedValue !== 'string' ||
            typeof englishValue !== 'string'
          ) {
            continue;
          }

          const override = translationValueContractOverrides[catalogPath];
          if (override) usedOverrides.add(catalogPath);
          const expectedContract = applyTranslationValueContractOverride(
            translationValueContract(
              englishValue,
              `en:${namespace}:${path.join('.')}`,
            ),
            override,
            catalogPath,
          );
          expect(
            translationValueContract(translatedValue, catalogPath),
            catalogPath,
          ).toEqual(expectedContract);
        }
      }
    }

    expect(sorted(usedOverrides)).toEqual(
      sorted(Object.keys(translationValueContractOverrides)),
    );
  });
});
