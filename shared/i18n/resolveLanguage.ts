import {
  defaultLanguage,
  isSupportedLanguage,
  type SupportedLanguage,
} from './languages.js';

export interface ResolvedLanguage {
  catalogLanguage: SupportedLanguage;
  formattingLocale: string;
}

const canonicalLocale = (languageTag: string): Intl.Locale | null => {
  const normalized = languageTag.trim().replaceAll('_', '-');
  if (!normalized) return null;

  try {
    return new Intl.Locale(normalized);
  } catch {
    return null;
  }
};

export const languageFromLocale = (languageTag: string): string | null =>
  canonicalLocale(languageTag)?.language ?? null;

export const formattingLocaleForLanguage = (
  language: SupportedLanguage,
  preferredLanguageTags: readonly string[],
): string => {
  let baseLanguageMatch: string | null = null;

  for (const languageTag of preferredLanguageTags) {
    const locale = canonicalLocale(languageTag);
    if (locale?.language !== language) continue;

    const canonicalLanguageTag = locale.toString();
    if (canonicalLanguageTag !== locale.language) return canonicalLanguageTag;
    baseLanguageMatch ??= canonicalLanguageTag;
  }

  return baseLanguageMatch ?? language;
};

export const resolveLanguage = (
  languageTag?: string | null,
): ResolvedLanguage => {
  if (!languageTag) {
    return {
      catalogLanguage: defaultLanguage,
      formattingLocale: defaultLanguage,
    };
  }

  const locale = canonicalLocale(languageTag);
  if (!locale) {
    return {
      catalogLanguage: defaultLanguage,
      formattingLocale: defaultLanguage,
    };
  }

  return {
    catalogLanguage: isSupportedLanguage(locale.language)
      ? locale.language
      : defaultLanguage,
    formattingLocale: locale.toString(),
  };
};
