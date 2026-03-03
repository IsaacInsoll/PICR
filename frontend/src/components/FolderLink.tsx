import { Anchor } from '@mantine/core';
import type { PicrFolder } from '@shared/types/picr';
import { useSetFolder } from '../hooks/useSetFolder';

export const FolderLink = ({
  folder,
  color,
}: {
  folder: PicrFolder;
  color?: string;
}) => {
  const setFolder = useSetFolder();

  if (!folder) return undefined;

  return (
    <Anchor c={color} onClick={() => setFolder(folder)}>
      {folder.name}
    </Anchor>
  );
};
