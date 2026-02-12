import { useAtom } from 'jotai';
import { Alert, Button, Paper, Stack, Text, Title } from '@mantine/core';
import { globalErrorAtom, clearGlobalError } from '@shared/globalErrorAtom';
import { DisconnectedIcon, RefreshIcon, WarningIcon } from '../PicrIcons';

export const GlobalErrorOverlay = () => {
  const [incident] = useAtom(globalErrorAtom);
  if (!incident) return null;

  const title =
    incident.type === 'network_unavailable'
      ? 'Network currently unavailable'
      : 'You do not have permission';

  const description =
    incident.type === 'network_unavailable'
      ? 'PICR could not reach the server. This is usually temporary.'
      : 'This request is not allowed for your current user.';

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
          <Alert variant="light" color="red" icon={<WarningIcon />}>
            {incident.message.replace('[GraphQL] ', '').replace('[Network] ', '')}
          </Alert>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              leftSection={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
            <Button variant="default" onClick={clearGlobalError}>
              Close warning
            </Button>
          </div>
        </Stack>
      </Paper>
    </div>
  );
};
