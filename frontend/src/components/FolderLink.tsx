import { Anchor } from '@mantine/core';
import { PicrFolder } from '../../types';
import { useSetFolder } from '../hooks/useSetFolder';

export const FolderLink = ({ folder }: { folder: PicrFolder }) => {
  const setFolder = useSetFolder();

  if (!folder) return undefined;

  return <Anchor onClick={() => setFolder(folder)}>{folder?.name}</Anchor>;
};
