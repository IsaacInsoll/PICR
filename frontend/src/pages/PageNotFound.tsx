import type { MantineStyleProp } from '@mantine/core';
import { Center, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export const PageNotFound = () => {
  const { t } = useTranslation('admin');
  const center: MantineStyleProp = { textAlign: 'center' };
  return (
    <Center style={{ height: '100vh' }}>
      <Stack gap={8}>
        <Title style={center}>{t('notFound.title')}</Title>
        <Text style={center} size="xl">
          {t('notFound.description')}
        </Text>
        <Text style={center} size="md" fs="italic">
          {t('notFound.contact')}
        </Text>
      </Stack>
    </Center>
  );
};
