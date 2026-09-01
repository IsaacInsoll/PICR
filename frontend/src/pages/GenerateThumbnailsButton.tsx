import { useMutation, useQuery } from 'urql';
import { generateThumbnailsMutation } from '@shared/urql/mutations/generateThumbnailsMutation';
import { Button, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { PhotoCheckIcon } from '../PicrIcons';
import { generateThumbnailsQuery } from '@shared/urql/queries/generateThumbnailsQuery';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { ErrorAlert } from '../components/ErrorAlert';

export const GenerateThumbnailsButton = ({
  folderId,
}: {
  folderId: string;
}) => {
  const { t } = useTranslation('admin');
  const [opened, setOpened] = useState(false);
  const queryContext = useMemo(() => ({ suspense: false }), []);
  const [result] = useQuery({
    query: generateThumbnailsQuery,
    variables: { folderId },
    pause: !opened,
    requestPolicy: 'network-only',
    context: queryContext,
  });
  const completion = result.data?.folder.thumbnailCompletion;
  const incompleteFiles = completion?.incompleteFiles ?? 0;
  const checking = result.fetching;
  const [{ fetching: generating, error: generateError }, thumbsMutation] =
    useMutation(generateThumbnailsMutation);
  const handleGenerate = () => {
    void thumbsMutation({ folderId: folderId }).then(({ error }) => {
      if (!error) setOpened(false);
    });
  };
  return (
    <>
      <Button
        variant="default"
        leftSection={<PhotoCheckIcon />}
        onClick={() => setOpened(true)}
      >
        {t('folder.thumbnails.action')}
      </Button>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t('folder.thumbnails.title')}
      >
        <Stack>
          {checking ? (
            <Group gap="sm">
              <Loader size="sm" />
              <Text size="sm">{t('folder.thumbnails.checking')}</Text>
            </Group>
          ) : null}
          {result.error ? <ErrorAlert message={result.error.message} /> : null}
          {generateError ? (
            <ErrorAlert message={generateError.message} />
          ) : null}
          {!checking && completion ? (
            <>
              <Text size="sm">
                {incompleteFiles === 0
                  ? t('folder.thumbnails.completeDescription')
                  : t('folder.thumbnails.missingDescription', {
                      count: incompleteFiles,
                    })}
              </Text>
              {incompleteFiles > 0 ? (
                <Text size="sm" c="dimmed">
                  {t('folder.thumbnails.missingArtifacts', {
                    count: completion.missingArtifacts,
                  })}
                </Text>
              ) : null}
              <Group justify="flex-end">
                <Button variant="default" onClick={() => setOpened(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  leftSection={<PhotoCheckIcon />}
                  loading={generating}
                  disabled={incompleteFiles === 0}
                  onClick={handleGenerate}
                >
                  {t('folder.thumbnails.generateMissing', {
                    count: incompleteFiles,
                  })}
                </Button>
              </Group>
            </>
          ) : null}
        </Stack>
      </Modal>
    </>
  );
};
