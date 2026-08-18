import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  isSupportedLanguage,
  supportedLanguages,
} from '@shared/i18n/languages';
import { useLanguage } from './useLanguage';

export const LanguageSwitcher = () => {
  const { t } = useTranslation('common');
  const { language, setLanguage } = useLanguage();

  return (
    <Select
      label={t('language.label')}
      value={language}
      data={supportedLanguages.map(({ code, name }) => ({
        value: code,
        label: name,
      }))}
      allowDeselect={false}
      onChange={(value) => {
        if (value && isSupportedLanguage(value)) void setLanguage(value);
      }}
      w={150}
      size="xs"
    />
  );
};
