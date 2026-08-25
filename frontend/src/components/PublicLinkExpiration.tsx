import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDateFormatters } from '../i18n/useDateFormatters';

const expirationDateFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
} satisfies Intl.DateTimeFormatOptions;

export const PublicLinkExpiration = ({
  expiresAt,
}: {
  expiresAt?: string | null;
}) => {
  const { t } = useTranslation('admin');
  const { formatDate } = useDateFormatters();
  if (!expiresAt) return null;

  return (
    <Text size="xs" c="dimmed">
      {t('links.editor.expiration')}:{' '}
      {formatDate(expiresAt, expirationDateFormatOptions)}
    </Text>
  );
};
