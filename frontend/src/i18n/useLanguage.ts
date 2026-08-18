import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '@shared/i18n/languages';
import { resolveLanguage } from '@shared/i18n/resolveLanguage';
import { changeLanguage, getFormattingLocale, i18n as picrI18n } from './i18n';

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const language = resolveLanguage(
    i18n.resolvedLanguage ?? i18n.language,
  ).catalogLanguage;

  const setLanguage = useCallback(
    (nextLanguage: SupportedLanguage) => changeLanguage(nextLanguage),
    [],
  );

  return {
    language,
    formattingLocale: getFormattingLocale(),
    setLanguage,
  };
};

export const currentFormattingLocale = () => getFormattingLocale();
export const currentLanguage = () =>
  resolveLanguage(picrI18n.resolvedLanguage ?? picrI18n.language)
    .catalogLanguage;
