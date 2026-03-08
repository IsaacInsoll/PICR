import type { AccessLogRow } from '@shared/types/queryRows';
import { Avatar, Group, Paper, Stack, Text } from '@mantine/core';
import { Suspense } from 'react';
import { LazyPicrAvatar } from './LazyPicrAvatar';
import { DateDisplay } from './FileListView/Filtering/PrettyDate';
import { AccessLogClientMeta } from './AccessLogClientMeta';

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
        {/*<Group gap={4} wrap="nowrap">*/}
        {/*  <FolderIcon size={11} style={{ opacity: 0.4, flexShrink: 0 }} />*/}
        {/*  <Text size="xs" c="dimmed" lineClamp={1}>*/}
        {/*    {log.folder?.name ?? 'Unknown Folder'}*/}
        {/*  </Text>*/}
        {/*</Group>*/}
        <AccessLogClientMeta
          ipAddress={log.ipAddress}
          userAgent={log.userAgent}
        />
      </Stack>
    </Paper>
  );
};
