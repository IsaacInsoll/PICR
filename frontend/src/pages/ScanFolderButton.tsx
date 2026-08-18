import { useState } from 'react';
import { Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from 'urql';
import { rescanFolderMutation } from '@shared/urql/mutations/rescanFolderMutation';
import { RefreshIcon } from '../PicrIcons';
import { ErrorAlert } from '../components/ErrorAlert';
import { useTranslation } from 'react-i18next';

export const ScanFolderButton = ({ folderId }: { folderId: string }) => {
  const { t } = useTranslation('admin');
  const [error, setError] = useState('');
  const [result, rescanFolder] = useMutation(rescanFolderMutation);

  const handleClick = async () => {
    setError('');
    const scanResult = await rescanFolder({ folderId });

    if (scanResult.error) {
      setError(scanResult.error.toString());
      return;
    }

    const complete = scanResult.data?.rescanFolder ?? false;
    notifications.show({
      color: complete ? 'green' : 'yellow',
      title: complete ? t('folder.scan.complete') : t('folder.scan.settling'),
      message: complete
        ? t('folder.scan.completeDescription')
        : t('folder.scan.settlingDescription'),
    });
  };

  return (
    <Stack gap="xs">
      <Button
        variant="default"
        loading={result.fetching}
        onClick={() => void handleClick()}
        leftSection={<RefreshIcon />}
      >
        {t('folder.scan.action')}
      </Button>
      <ErrorAlert message={error} />
    </Stack>
  );
};
