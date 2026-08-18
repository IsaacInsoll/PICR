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
