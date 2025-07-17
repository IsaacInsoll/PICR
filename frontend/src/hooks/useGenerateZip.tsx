import { useSetAtom } from 'jotai/index';
import { useMutation } from 'urql';
import { generateZipMutation } from '@shared/urql/mutations/generateZipMutation';
import { FolderHash } from '../../../backend/helpers/zip';
import { linksToDownloadAtom } from '../components/DownloadZipButton';

export const useGenerateZip = (
  folder: MinimalFolder,
  onComplete?: () => void,
) => {
  const setLinks = useSetAtom(linksToDownloadAtom);
  const [, mutate] = useMutation(generateZipMutation);

  return async () => {
    return mutate({ folderId: folder.id }).then((res) => {
      if (res?.data) {
        const fh: FolderHash = { folder, hash: res.data.generateZip };
        setLinks((l) => [...l, fh]);
        if (onComplete) onComplete();
      }
    });
  };
};
