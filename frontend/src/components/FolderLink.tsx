import type { PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { useFolderLink } from '../hooks/useSetFolder';
import { PicrLink } from './PicrLink';

export const FolderLink = ({
  folder,
  color,
}: {
  folder: PicrFolder;
  color?: string;
}) => {
  const { to } = useFolderLink(folder);

  return (
    <PicrLink c={color} to={to}>
      {normalizeDisplayName(folder.name)}
    </PicrLink>
  );
};
