import { useQuery } from 'urql';
import { useEffect, useRef } from 'react';
import { linksToDownloadAtom } from './DownloadZipButton';
import type { PendingZipDownload } from './DownloadZipButton';
import { useAtom } from 'jotai';
import { notifications } from '@mantine/notifications';
import {
  Box,
  Group,
  Loader,
  Paper,
  Progress,
  Stack,
  Text,
} from '@mantine/core';
import { Page } from './Page';
import { taskQuery } from '@shared/urql/queries/taskQuery';
import {
  FILE_DERIVED_FIELDS_BACKFILL_TASK_ID,
  IMAGE_DIMENSION_BACKFILL_TASK_ID,
  MEDIA_IMPORT_TASK_ID,
  MEDIA_SCAN_TASK_ID,
} from '@shared/tasks/mediaTaskIds.js';
import { useRequery } from '@shared/hooks/useRequery';
import { withBasePath } from '../helpers/baseHref';
import { useTranslation } from 'react-i18next';

interface TaskProgressProps {
  name: string;
  step?: number | null;
  totalSteps?: number | null;
}

type MediaTaskTranslationKey =
  | 'task.imageDimensionBackfill'
  | 'task.mediaImport'
  | 'task.mediaScan'
  | 'task.searchPreparation';

export const mediaTaskTranslationKey = (
  id: string | null | undefined,
): MediaTaskTranslationKey | null => {
  if (id === IMAGE_DIMENSION_BACKFILL_TASK_ID)
    return 'task.imageDimensionBackfill';
  if (id === FILE_DERIVED_FIELDS_BACKFILL_TASK_ID)
    return 'task.searchPreparation';
  if (id === MEDIA_IMPORT_TASK_ID) return 'task.mediaImport';
  if (id === MEDIA_SCAN_TASK_ID) return 'task.mediaScan';
  return null;
};

export const determinateTaskProgress = (
  step: number | null | undefined,
  totalSteps: number | null | undefined,
): { step: number; totalSteps: number } | null => {
  if (
    step === null ||
    step === undefined ||
    totalSteps === null ||
    totalSteps === undefined ||
    totalSteps <= 0
  ) {
    return null;
  }
  return { step, totalSteps };
};

export const TaskProgress = ({ name, step, totalSteps }: TaskProgressProps) => {
  const progress = determinateTaskProgress(step, totalSteps);
  return (
    <>
      <Box pt={4} style={{ flexGrow: 1 }}>
        {progress ? (
          <Progress
            aria-label={name}
            style={{ flex: 1 }}
            value={(progress.step / progress.totalSteps) * 100.0}
            animated
            transitionDuration={200}
          />
        ) : null}
      </Box>
      {progress ? (
        <Box>
          {progress.step}/{progress.totalSteps}
        </Box>
      ) : (
        <Box>
          <Loader size="xs" />
        </Box>
      )}
    </>
  );
};

export type PendingZipOutcome = 'complete' | 'failed' | 'pending';

// ZIP queue entries are shared by everyone viewing the folder and are never
// removed, so a previous attempt's `Error` stays under the same key until the
// ZIP is requested again. A retry's first render still holds that stale
// status, so only trust a failure from a task request that started after this
// ZIP request. A stale `Complete` is safe: it means the archive exists on disk.
export const pendingZipOutcome = (
  pending: Pick<PendingZipDownload, 'folder' | 'hash' | 'requestedAt'>,
  tasks: readonly { id?: string | null; status?: string | null }[] | undefined,
  latestCompletedRequestStartedAt: number | null,
): PendingZipOutcome => {
  const task = tasks?.find(
    ({ id }) => id === `${pending.folder.id}${pending.hash}`,
  );
  if (task?.status === 'Complete') return 'complete';
  if (
    task?.status === 'Error' &&
    latestCompletedRequestStartedAt !== null &&
    latestCompletedRequestStartedAt > pending.requestedAt
  ) {
    return 'failed';
  }
  return 'pending';
};

export const TaskSummary = ({ folderId }: { folderId: string }) => {
  const { t } = useTranslation('gallery');
  const [result, requery] = useQuery({
    query: taskQuery,
    variables: { folderId },
  });

  const [zips, setZips] = useAtom(linksToDownloadAtom);

  useRequery(requery as Parameters<typeof useRequery>[0], 1000);

  const tasks = result.data?.tasks;
  const activeRequestStartedAt = useRef<number | null>(null);
  const latestCompletedRequestStartedAt = useRef<number | null>(null);

  // Polling uses cache-and-network, which renders cached (stale) data before
  // each server response. Record when a network request begins, then publish
  // that timestamp only after it completes successfully. Arrival time is not
  // sufficient: an old poll can start before a ZIP retry and finish afterward.
  // This effect must stay above the pending-ZIP effect so both see the same
  // update.
  useEffect(() => {
    if (result.stale || result.fetching) {
      activeRequestStartedAt.current ??= Date.now();
      return;
    }
    if (result.error) {
      activeRequestStartedAt.current = null;
      return;
    }
    if (tasks && activeRequestStartedAt.current !== null) {
      latestCompletedRequestStartedAt.current = activeRequestStartedAt.current;
      activeRequestStartedAt.current = null;
    }
  }, [tasks, result.error, result.stale, result.fetching]);

  useEffect(() => {
    zips.forEach((fh) => {
      const outcome = pendingZipOutcome(
        fh,
        tasks,
        latestCompletedRequestStartedAt.current,
      );
      if (outcome === 'pending') return;
      if (outcome === 'complete') {
        triggerDownload(
          withBasePath(`/zip/${fh.folder.id}/${fh.hash}/${fh.folder.name}`),
        );
      } else {
        notifications.show({
          color: 'red',
          title: t('download.zipFailed.title'),
          message: t('download.zipFailed.message', { name: fh.folder.name }),
        });
      }
      setZips((list) => list.filter((zz) => zz !== fh));
    });
  }, [zips, tasks, result.stale, result.fetching, setZips, t]);

  // Failed ZIPs are reported to the requester above. Never render them as
  // progress: other viewers would otherwise see a permanent stuck row.
  const remaining = tasks?.filter(
    (task) => task.status !== 'Complete' && task.status !== 'Error',
  );

  // //TODO: remove this testing line
  // remaining = [
  //   { id: '123', step: 3, totalSteps: 8, name: 'Testing task styling' },
  //   { id: '1234', name: 'Unstepped task' },
  // ];

  if (!remaining?.length) return null;
  // Keep these calls literal: i18next-cli cannot extract a dynamic key,
  // even when TypeScript narrows the possible values.
  const mediaTaskLabels: Record<MediaTaskTranslationKey, string> = {
    'task.imageDimensionBackfill': t('task.imageDimensionBackfill'),
    'task.mediaImport': t('task.mediaImport'),
    'task.mediaScan': t('task.mediaScan'),
    'task.searchPreparation': t('task.searchPreparation'),
  };

  return (
    <Page>
      <Paper shadow="xs" withBorder p="xs" mb="md" mt="lg">
        <Stack gap="sm">
          {remaining.map(({ id, name, step, totalSteps }) => {
            const pendingZip = zips.find(
              ({ folder, hash }) => id === folder.id + hash,
            );
            const mediaTaskKey = mediaTaskTranslationKey(id);
            const displayName = pendingZip
              ? t('download.preparing', { name: pendingZip.folder.name })
              : (mediaTaskKey && mediaTaskLabels[mediaTaskKey]) || name;
            return (
              <Group gap="small" key={id}>
                <Text>{displayName}</Text>
                <TaskProgress
                  name={displayName}
                  step={step}
                  totalSteps={totalSteps}
                />
              </Group>
            );
          })}
        </Stack>
      </Paper>
    </Page>
  );
};

const triggerDownload = (href: string) => {
  const link = document.createElement('a');
  link.href = href;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
