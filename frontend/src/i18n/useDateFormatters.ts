import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatDate as formatDateValue,
  formatRelativeTime as formatRelativeTimeValue,
  type DateInput,
} from '@shared/i18n/formatting';
import { prettyDate as prettyDateValue } from '@shared/prettyDate';
import { useLanguage } from './useLanguage';

export const useDateFormatters = () => {
  const { t } = useTranslation('common');
  const { catalogLanguage, formattingLocale } = useLanguage();
  const invalidDateLabel = t('date.invalid');

  const formatDate = useCallback(
    (value: DateInput, options?: Intl.DateTimeFormatOptions) =>
      formatDateValue(value, formattingLocale, options, invalidDateLabel),
    [formattingLocale, invalidDateLabel],
  );

  const prettyDate = useCallback(
    (dateString: string) =>
      prettyDateValue(dateString, formattingLocale, invalidDateLabel),
    [formattingLocale, invalidDateLabel],
  );

  const formatRelativeTime = useCallback(
    (value: DateInput, now?: DateInput) =>
      formatRelativeTimeValue(value, catalogLanguage, now, invalidDateLabel),
    [catalogLanguage, invalidDateLabel],
  );

  return {
    catalogLanguage,
    formattingLocale,
    invalidDateLabel,
    formatDate,
    prettyDate,
    formatRelativeTime,
  };
};
