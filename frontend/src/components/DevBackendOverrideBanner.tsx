import { Alert, Anchor, Code, Group, Text } from '@mantine/core';
import { WarningIcon } from '../PicrIcons';

declare global {
  interface Window {
    __PICR_DEV_BACKEND_URL__?: string;
  }
}

const getDevBackendOverrideUrl = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') return undefined;
  return window.__PICR_DEV_BACKEND_URL__?.trim();
};

const labelForUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl);
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}`;
  } catch {
    return rawUrl;
  }
};

export const DevBackendOverrideBanner = () => {
  const devBackendOverrideUrl = getDevBackendOverrideUrl();
  if (!devBackendOverrideUrl) return null;

  return (
    <Alert
      color="yellow"
      icon={<WarningIcon />}
      radius={0}
      style={{ position: 'sticky', top: 0, zIndex: 300 }}
      variant="light"
    >
      <Group gap="xs">
        <Text fw={700} size="sm">
          Backend override
        </Text>
        <Code>{labelForUrl(devBackendOverrideUrl)}</Code>
        <Text c="dimmed" size="sm">
          GraphQL mutations other than login are blocked by the dev proxy.
        </Text>
        <Anchor href={devBackendOverrideUrl} size="sm" target="_blank">
          Open
        </Anchor>
      </Group>
    </Alert>
  );
};
