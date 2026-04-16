import { Anchor } from '@mantine/core';
import type { PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { useSetFolder } from '../hooks/useSetFolder';

export const FolderLink = ({
  folder,
  color,
}: {
  folder: PicrFolder;
  color?: string;
}) => {
  const setFolder = useSetFolder();

  return (
    <Anchor c={color} onClick={() => setFolder(folder)}>
      {normalizeDisplayName(folder.name)}
    </Anchor>
  );
};
