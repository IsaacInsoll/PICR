import { Link, LinkProps } from 'expo-router';
import { useHostname } from '@/src/hooks/useHostname';
import { File, Folder } from '@shared/gql/graphql';
import {
  addToFileCache,
  addToFolderCache,
  FileIDandName,
  FolderIDandName,
} from '@/src/helpers/folderCache';
import { ReactNode } from 'react';

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

export const AppFileLink = ({
  file,
  children,
  ...props
}: { file: FileIDandName } & Omit<LinkProps, 'href'>) => {
  const pathname = useAppFileLink(file);
  return (
    <Link href={{ pathname }} {...props} onPress={() => addToFileCache(file)}>
      {children}
    </Link>
  );
};

// Link to either file or folder, requires `__typename`
export const AppLink = ({
  item,
  children,
  asChild,
}: {
  item: File | Folder;
  children: ReactNode;
  asChild?: boolean;
}) => {
  if (item.__typename === 'Folder') {
    return (
      <AppFolderLink folder={item} asChild={asChild}>
        {children}
      </AppFolderLink>
    );
  } else {
    return (
      <AppFileLink file={item} asChild={asChild}>
        {children}
      </AppFileLink>
    );
  }
};

export const useAppFolderLink = (folder: { id: string }) => {
  const hostname = useHostname();

  return hostname + '/admin/f/' + folder.id;
};

export const useAppFileLink = (file: FileIDandName) => {
  return useAppFolderLink({ id: file.folderId }) + '/' + file.id;
};
