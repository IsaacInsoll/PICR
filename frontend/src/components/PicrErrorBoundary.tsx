import type { FallbackProps } from 'react-error-boundary';
import { ErrorBoundary } from 'react-error-boundary';
import {
  Alert,
  Box,
  Button,
  Center,
  Code,
  Loader,
  Stack,
  Text,
} from '@mantine/core';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ErrorIcon } from '../PicrIcons';
import {
  canReloadForNewVersion,
  isChunkLoadError,
  reloadForNewVersion,
} from '../helpers/chunkReload';
import { useTranslation } from 'react-i18next';

export const PicrErrorBoundary = ({ children }: { children: ReactNode }) => {
  return (
    <ErrorBoundary fallbackRender={fallbackRender}>{children}</ErrorBoundary>
  );
};

// Safety net for the stale-chunk crash: if a lazily-loaded route/component fails
// to import because a new build was deployed, recover by reloading instead of
// showing the generic error. This also catches cases where the window-level
// `vite:preloadError` event doesn't fire (e.g. errors thrown during render).
function ChunkLoadFallback({ error }: { error: Error }) {
  const { t } = useTranslation('gallery');
  // Decide up front (purely) whether a recovery reload is allowed, then perform
  // it as an effect. If we've already reloaded within the cooldown, the deploy
  // is likely genuinely broken rather than merely stale, so we surface the real
  // error with a manual retry instead of spinning on "Updating…" forever.
  const [willReload] = useState(canReloadForNewVersion);
  useEffect(() => {
    if (willReload) reloadForNewVersion();
  }, [willReload]);

  if (willReload) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="sm">
          <Loader />
          <Text c="dimmed">{t('error.boundary.updating')}</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Alert
      variant="light"
      color="red"
      title={t('error.boundary.latestTitle')}
      icon={<ErrorIcon />}
    >
      <Stack gap="sm">
        <Text size="sm">{t('error.boundary.latestDescription')}</Text>
        <Box>
          <Button
            color="red"
            variant="light"
            onClick={() => window.location.reload()}
          >
            {t('error.boundary.reload')}
          </Button>
        </Box>
        <Code block color="transparent" c="red" style={{ fontSize: 9 }}>
          {error.stack}
        </Code>
      </Stack>
    </Alert>
  );
}

function fallbackRender({ error }: FallbackProps) {
  if (isChunkLoadError(error)) {
    return <ChunkLoadFallback error={error} />;
  }
  return <UnexpectedErrorFallback error={error} />;
}

function UnexpectedErrorFallback({ error }: { error: Error }) {
  const { t } = useTranslation('gallery');
  // Call resetErrorBoundary() to reset the error boundary and retry the render.
  return (
    <Alert
      variant="light"
      color="red"
      title={t('error.boundary.unexpectedTitle')}
      icon={<ErrorIcon />}
    >
      <Stack gap="sm">
        <Box>
          <Code color="red.9" c="white" style={{ fontSize: 14 }}>
            {prettyMessage(error.message)}
          </Code>
        </Box>

        <Code block color="transparent" c="red" style={{ fontSize: 9 }}>
          {error.stack}
        </Code>
      </Stack>
    </Alert>
  );
}

const prettyMessage = (errorMessage: string) => {
  if (errorMessage === 'r.definitions is not iterable')
    return 'GraphQL Query Error. Try a build';
  return errorMessage;
};
