import { useState } from 'react';
import { Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from 'urql';
import { rescanFolderMutation } from '@shared/urql/mutations/rescanFolderMutation';
import { RefreshIcon } from '../PicrIcons';
import { ErrorAlert } from '../components/ErrorAlert';

export const ScanFolderButton = ({ folderId }: { folderId: string }) => {
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
      title: complete ? 'Scan complete' : 'Scan still settling',
      message: complete
        ? 'Folder contents are up to date.'
        : 'Some files are still changing. Run the scan again shortly.',
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
        Scan Now
      </Button>
      <ErrorAlert message={error} />
    </Stack>
  );
};
