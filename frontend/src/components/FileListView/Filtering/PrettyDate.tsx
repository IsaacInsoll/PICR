import { Text, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';
import {
  formatDate,
  formatRelativeTime,
  tooltipDateTimeFormatOptions,
} from '@shared/i18n/formatting';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../i18n/useLanguage';

export const DateDisplay = ({
  dateString,
}: {
  dateString?: string;
}): ReactNode => {
  const { t } = useTranslation('common');
  const { catalogLanguage, formattingLocale } = useLanguage();
  if (!dateString) return null;
  const invalidLabel = t('date.invalid');
  const ago = formatRelativeTime(
    dateString,
    catalogLanguage,
    undefined,
    invalidLabel,
  );
  const full = formatDate(
    dateString,
    formattingLocale,
    tooltipDateTimeFormatOptions,
    invalidLabel,
  );

  return (
    <Tooltip label={full}>
      <Text size="sm" c="dimmed">
        {ago}
      </Text>
    </Tooltip>
  );
};
