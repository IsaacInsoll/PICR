export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'uk', name: 'Українська' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]['code'];

export const defaultLanguage: SupportedLanguage = 'en';

export const supportedLanguageCodes = supportedLanguages.map(
  ({ code }) => code,
) as SupportedLanguage[];

export const isSupportedLanguage = (
  language: string,
): language is SupportedLanguage =>
  supportedLanguageCodes.includes(language as SupportedLanguage);
