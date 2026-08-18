import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  isSupportedLanguage,
  supportedLanguages,
} from '@shared/i18n/languages';
import { useLanguage } from './useLanguage';

export const LanguageSwitcher = ({
  compact = false,
}: {
  compact?: boolean;
}) => {
  const { t } = useTranslation('common');
  const { catalogLanguage, setLanguage } = useLanguage();

  return (
    <Select
      label={compact ? undefined : t('language.label')}
      aria-label={compact ? t('language.label') : undefined}
      value={catalogLanguage}
      data={supportedLanguages.map(({ code, name }) => ({
        value: code,
        label: name,
      }))}
      allowDeselect={false}
      onChange={(value) => {
        if (value && isSupportedLanguage(value)) void setLanguage(value);
      }}
      w={compact ? 120 : 150}
      size="xs"
    />
  );
};
