import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  defaultLanguage,
  isSupportedLanguage,
  supportedLanguageCodes,
  type SupportedLanguage,
} from '@shared/i18n/languages';
import {
  formattingLocaleForLanguage,
  languageFromLocale,
  resolveLanguage,
} from '@shared/i18n/resolveLanguage';
import {
  defaultNamespace,
  namespaces,
  resources,
} from '@shared/i18n/resources';

export const languagePreferenceStorageKey = 'picr:language';

const readSavedLanguage = (): SupportedLanguage | null => {
  try {
    const saved = window.localStorage.getItem(languagePreferenceStorageKey);
    return saved && isSupportedLanguage(saved) ? saved : null;
  } catch {
    return null;
  }
};

const browserLanguageTags = (): readonly string[] => {
  if (navigator.languages.length > 0) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
};

const directlySupportedLanguage = (
  languageTag: string,
): SupportedLanguage | null => {
  const language = languageFromLocale(languageTag);
  return language && isSupportedLanguage(language) ? language : null;
};

type LanguagePreferenceSource = 'query' | 'saved' | 'browser' | 'default';

interface DetectedLanguagePreference {
  languageTag: string;
  source: LanguagePreferenceSource;
}

const detectedLanguagePreference = (): DetectedLanguagePreference => {
  const queryLanguage = new URL(window.location.href).searchParams.get('lng');
  if (queryLanguage) return { languageTag: queryLanguage, source: 'query' };

  const savedLanguage = readSavedLanguage();
  if (savedLanguage) return { languageTag: savedLanguage, source: 'saved' };

  const browserLanguage = browserLanguageTags().find(directlySupportedLanguage);
  if (browserLanguage) {
    return { languageTag: browserLanguage, source: 'browser' };
  }

  return { languageTag: defaultLanguage, source: 'default' };
};

const detectedPreference = detectedLanguagePreference();
const detectedLanguage = resolveLanguage(detectedPreference.languageTag);
const regionalLanguageTags = [
  detectedLanguage.formattingLocale,
  ...browserLanguageTags(),
];
let formattingLocale =
  detectedPreference.source === 'saved'
    ? formattingLocaleForLanguage(
        detectedLanguage.catalogLanguage,
        regionalLanguageTags,
      )
    : detectedLanguage.formattingLocale;

void i18n.use(initReactI18next).init({
  resources,
  lng: detectedLanguage.catalogLanguage,
  fallbackLng: defaultLanguage,
  supportedLngs: supportedLanguageCodes,
  ns: namespaces,
  defaultNS: defaultNamespace,
  fallbackNS: defaultNamespace,
  initAsync: false,
  returnNull: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

const syncDocumentLanguage = (languageTag: string) => {
  document.documentElement.lang = resolveLanguage(languageTag).catalogLanguage;
};

syncDocumentLanguage(detectedLanguage.catalogLanguage);
i18n.on('languageChanged', syncDocumentLanguage);

const clearQueryLanguage = () => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('lng')) return;

  url.searchParams.delete('lng');
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
};

export const getFormattingLocale = () => formattingLocale;

export const changeLanguage = async (language: SupportedLanguage) => {
  formattingLocale = formattingLocaleForLanguage(
    language,
    regionalLanguageTags,
  );
  clearQueryLanguage();

  try {
    window.localStorage.setItem(languagePreferenceStorageKey, language);
  } catch {
    // The active tab can still change language when storage is unavailable.
  }

  await i18n.changeLanguage(language);
};

export { i18n };
