import { Link, LinkProps } from 'expo-router';
import { useHostname } from '@/src/hooks/useHostname';
import { addToFolderCache, FolderIDandName } from '@/src/helpers/folderCache';

export const AppFolderLink = ({
  folder,
  children,
  ...props
}: { folder: FolderIDandName } & Omit<LinkProps, 'href'>) => {
  const pathname = useAppFolderLink(folder);
  return (
    <Link
      href={{ pathname }}
      {...props}
      onPress={() => addToFolderCache(folder)}
    >
      {children}
    </Link>
  );
};

export const useAppFolderLink = (folder: FolderIDandName) => {
  const hostname = useHostname();

  return hostname + '/admin/f/' + folder.id;
};
