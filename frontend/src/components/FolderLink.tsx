import type { PicrFolder } from '@shared/types/picr';
import { useFolderLink } from '../hooks/useSetFolder';
import { PicrLink } from './PicrLink';
import { useFolderNameFormatter } from '../i18n/useFolderNameFormatter';

export const FolderLink = ({
  folder,
  color,
}: {
  folder: PicrFolder;
  color?: string;
}) => {
  const { to } = useFolderLink(folder);
  const formatFolderName = useFolderNameFormatter();

  return (
    <PicrLink c={color} to={to}>
      {formatFolderName(folder)}
    </PicrLink>
  );
};
