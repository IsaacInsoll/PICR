import { useQuery } from 'urql';
import { useEffect } from 'react';
import { linksToDownloadAtom } from './DownloadZipButton';
import { useAtom } from 'jotai/index';
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
import { taskQuery } from '../urql/queries/taskQuery';
import { useRequery } from '../hooks/useRequery';

export const TaskSummary = ({ folderId }: { folderId: string }) => {
  const [result, requery] = useQuery({
    query: taskQuery,
    variables: { folderId },
  });

  const [zips, setZips] = useAtom(linksToDownloadAtom);

  useRequery(requery, 1000);

  const tasks = result.data?.tasks;
  const complete = tasks?.filter((t) => t.status == 'Complete');

  useEffect(() => {
    zips.map((fh) => {
      const task = complete?.find(({ id }) => id === fh.folder?.id + fh.hash);
      if (task) {
        console.log(task);
        console.log(fh);
        const url = `/zip/${fh.folder?.id}/${fh.hash}/${fh.folder?.name}`;
        triggerDownload(url);
        setZips((list) => list.filter((zz) => zz !== fh));
      }
    });
  }, [zips, complete]);
  const remaining = tasks?.filter((t) => t.status != 'Complete');

  // //TODO: remove this testing line
  // remaining = [
  //   { id: '123', step: 3, totalSteps: 8, name: 'Testing task styling' },
  //   { id: '1234', name: 'Unstepped task' },
  // ];

  if (!remaining || !remaining.length) return null;
  return (
    <Page>
      <Paper shadow="xs" withBorder p="xs" mb="md" mt="lg">
        <Stack gap="sm">
          {remaining.map(({ id, name, step, totalSteps }) => {
            const hasSteps = step && totalSteps && totalSteps > 0;
            return (
              <Group gap="small" key={id}>
                <Text>{name}</Text>
                <Box pt={4} style={{ flexGrow: 1 }}>
                  {hasSteps ? (
                    <Progress
                      style={{ flex: 1 }}
                      value={(step / totalSteps) * 100.0}
                      animated
                    />
                  ) : null}
                </Box>
                {hasSteps ? (
                  <Box>
                    {step}/{totalSteps}
                  </Box>
                ) : (
                  <Box>
                    <Loader color="blue" size="xs" />
                  </Box>
                )}
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
