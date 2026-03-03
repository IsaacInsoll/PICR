import type { AccessLogRow } from '@shared/types/queryRows';
import type { BadgeProps } from '@mantine/core';
import { Avatar, Badge, Code, Group, Paper, Stack, Text } from '@mantine/core';
import { Suspense } from 'react';
import { LazyPicrAvatar } from './LazyPicrAvatar';
import { DateDisplay } from './FileListView/Filtering/PrettyDate';
import { FolderIcon } from '../PicrIcons';
import { UAParser } from 'ua-parser-js';

export const AccessLogListItem = ({ log }: { log: AccessLogRow }) => {
  if (!log) return null;
  return (
    <Paper withBorder p="sm" radius="md">
      <Stack gap={6}>
        <Group justify="space-between" wrap="nowrap">
          <Suspense fallback={<Avatar size="sm" radius="xl" />}>
            {log.userId ? (
              <LazyPicrAvatar
                userId={log.userId}
                showName={true}
                props={{ size: 'sm', radius: 'xl' }}
              />
            ) : (
              <Text size="sm" c="dimmed">
                Unknown
              </Text>
            )}
          </Suspense>
          <DateDisplay dateString={log.timestamp} />
        </Group>
        <Group gap="xs" wrap="nowrap">
          {log.folder ? (
            <Group gap={4} wrap="nowrap">
              <FolderIcon size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
              <Text size="xs" c="dimmed">
                {log.folder.name}
              </Text>
            </Group>
          ) : null}
          {log.ipAddress ? (
            <Code style={{ fontSize: '11px' }}>{log.ipAddress}</Code>
          ) : null}
          <UserAgentBadges userAgent={log.userAgent} />
        </Group>
      </Stack>
    </Paper>
  );
};

const UserAgentBadges = ({ userAgent }: { userAgent?: string | null }) => {
  if (!userAgent) return null;
  const { device, browser, os } = UAParser(userAgent);
  return (
    <Group gap="xs" wrap="nowrap">
      {browser.name ? (
        <Badge {...badgeProps} variant="outline">
          {browser.name}
        </Badge>
      ) : null}
      {device.model ? <Badge {...badgeProps}>{device.toString()}</Badge> : null}
      {os.name ? (
        <Badge {...badgeProps} variant="light">
          {os.toString()}
        </Badge>
      ) : null}
    </Group>
  );
};

const badgeProps: BadgeProps = { size: 'xs' };
