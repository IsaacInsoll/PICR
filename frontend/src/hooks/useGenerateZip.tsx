import { useSetAtom } from 'jotai';
import { useMutation } from 'urql';
import { generateZipMutation } from '@shared/urql/mutations/generateZipMutation';
import { generateMediaResultsZipMutation } from '@shared/urql/mutations/generateMediaResultsZipMutation';
import type { PendingZipDownload } from '../components/DownloadZipButton';
import { linksToDownloadAtom } from '../components/DownloadZipButton';
import { useCanDownload } from './useMe';
import type { PicrFolder } from '@shared/types/picr';
import type { MediaResultsSelectionInput } from '@shared/gql/graphql';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';

export const useGenerateZip = (
  folder: PicrFolder,
  onComplete?: () => void,
  selection?: MediaResultsSelectionInput,
  expectedSelectionCount?: number,
) => {
  const { t } = useTranslation('gallery');
  const canDownload = useCanDownload();
  const setLinks = useSetAtom(linksToDownloadAtom);
  const [, mutate] = useMutation(generateZipMutation);
  const [, mutateSelection] = useMutation(generateMediaResultsZipMutation);

  if (!canDownload) return null;

  return async () => {
    if (selection) {
      const response = await mutateSelection({ input: selection });
      const artifact = response.data?.generateMediaResultsZip;
      if (!artifact) return undefined;
      if (
        expectedSelectionCount !== undefined &&
        artifact.count !== expectedSelectionCount
      ) {
        notifications.show({
          color: 'yellow',
          title: t('download.selectionChanged.title'),
          message: t('download.selectionChanged.message', {
            count: artifact.count,
          }),
        });
      }
      const fh: PendingZipDownload = {
        folder,
        hash: artifact.token,
        requestedAt: Date.now(),
      };
      setLinks((l) => [...l, fh]);
      if (onComplete) onComplete();
      return artifact.count;
    }
    const response = await mutate({ folderId: folder.id });
    if (!response.data) return undefined;
    const fh: PendingZipDownload = {
      folder,
      hash: response.data.generateZip,
      requestedAt: Date.now(),
    };
    setLinks((l) => [...l, fh]);
    if (onComplete) onComplete();
    return undefined;
  };
};
