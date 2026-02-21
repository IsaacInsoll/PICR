import { useSetAtom } from 'jotai';
import { useMutation } from 'urql';
import { generateZipMutation } from '@shared/urql/mutations/generateZipMutation';
import {
  FolderHash,
  linksToDownloadAtom,
} from '../components/DownloadZipButton';
import { useCanDownload } from './useMe';
import { PicrFolder } from '../../types';

export const useGenerateZip = (folder: PicrFolder, onComplete?: () => void) => {
  const canDownload = useCanDownload();
  const setLinks = useSetAtom(linksToDownloadAtom);
  const [, mutate] = useMutation(generateZipMutation);

  if (!canDownload) return null;

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
