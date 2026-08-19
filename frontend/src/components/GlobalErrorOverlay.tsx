import { useAtom } from 'jotai';
import { Alert, Button, Paper, Stack, Text, Title } from '@mantine/core';
import { globalErrorAtom, clearGlobalError } from '@shared/globalErrorAtom';
import { stripUrqlErrorPrefixes } from '@shared/urql/stripUrqlErrorPrefixes';
import { DisconnectedIcon, RefreshIcon, WarningIcon } from '../PicrIcons';
import { useTranslation } from 'react-i18next';

export const GlobalErrorOverlay = () => {
  const { t } = useTranslation('gallery');
  const [incident] = useAtom(globalErrorAtom);
  if (!incident) return null;

  const title =
    incident.type === 'network_unavailable'
      ? t('error.global.networkUnavailable.title')
      : t('error.global.noPermissions.title');

  const description =
    incident.reason !== undefined
      ? t(`error.global.reason.${incident.reason}`)
      : incident.type === 'network_unavailable'
        ? t('error.global.networkUnavailable.description')
        : t('error.global.noPermissions.description');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <Paper withBorder shadow="xl" radius="md" p="lg" maw={560} w="100%">
        <Stack gap="md">
          <Title order={3} style={{ display: 'flex', gap: '0.5rem' }}>
            {incident.type === 'network_unavailable' ? (
              <DisconnectedIcon />
            ) : (
              <WarningIcon />
            )}
            {title}
          </Title>
          <Text c="dimmed">{description}</Text>
          {incident.diagnosticMessage || incident.operationName ? (
            <Alert variant="light" color="red" icon={<WarningIcon />}>
              {incident.diagnosticMessage
                ? stripUrqlErrorPrefixes(incident.diagnosticMessage)
                : null}
              {incident.operationName ? (
                <Text size="sm" mt="xs">
                  {t('error.operation', {
                    name: `${incident.operationName}${
                      incident.operationKind
                        ? ` (${incident.operationKind})`
                        : ''
                    }`,
                  })}
                </Text>
              ) : null}
            </Alert>
          ) : null}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              leftSection={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              {t('error.retry')}
            </Button>
            <Button variant="default" onClick={clearGlobalError}>
              {t('error.closeWarning')}
            </Button>
          </div>
        </Stack>
      </Paper>
    </div>
  );
};
