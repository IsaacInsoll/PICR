import { useQuery } from 'urql';
import { useEffect } from 'react';
import { linksToDownloadAtom } from './DownloadZipButton';
import { useAtom } from 'jotai';
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
  'task.imageDimensionBackfill' | 'task.mediaImport' | 'task.mediaScan';

export const mediaTaskTranslationKey = (
  id: string | null | undefined,
): MediaTaskTranslationKey | null => {
  if (id === IMAGE_DIMENSION_BACKFILL_TASK_ID)
    return 'task.imageDimensionBackfill';
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

export const TaskSummary = ({ folderId }: { folderId: string }) => {
  const { t } = useTranslation('gallery');
  const [result, requery] = useQuery({
    query: taskQuery,
    variables: { folderId },
  });

  const [zips, setZips] = useAtom(linksToDownloadAtom);

  useRequery(requery as Parameters<typeof useRequery>[0], 1000);

  const tasks = result.data?.tasks;
  const complete = tasks?.filter((t) => t.status === 'Complete');

  useEffect(() => {
    zips.forEach((fh) => {
      const task = complete?.find(({ id }) => id === fh.folder.id + fh.hash);
      if (task) {
        const url = withBasePath(
          `/zip/${fh.folder.id}/${fh.hash}/${fh.folder.name}`,
        );
        triggerDownload(url);
        setZips((list) => list.filter((zz) => zz !== fh));
      }
    });
  }, [zips, complete, setZips]);
  const remaining = tasks?.filter((t) => t.status !== 'Complete');

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
