import { Anchor } from '@mantine/core';
import { MinimalFolder } from '../../types';
import { useSetFolder } from '../useSetFolder';

export const FolderLink = ({ folder }: { folder: MinimalFolder }) => {
  const setFolder = useSetFolder();

  if (!folder) return undefined;

  return <Anchor onClick={() => setFolder(folder)}>{folder?.name}</Anchor>;
};
