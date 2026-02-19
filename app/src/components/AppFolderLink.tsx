import { Href, Link, LinkProps } from 'expo-router';
import { useHostname, useUuid } from '@/src/hooks/useHostname';
import {
  addToFileCache,
  addToFolderCache,
  FileIDandName,
  FolderIDandName,
} from '@/src/helpers/folderCache';
import { ReactNode } from 'react';

type LinkableFolder = {
  __typename: 'Folder';
  id: string;
  name: string;
  title?: string | null;
};

type LinkableFile = {
  __typename?: string;
  id: string;
  name: string;
  folderId: string;
};

export const AppFolderLink = ({
  folder,
  children,
  ...props
}: { folder: FolderIDandName } & Omit<LinkProps, 'href'>) => {
  const href = useAppFolderLink(folder);
  return (
    <Link href={href} {...props} onPress={() => addToFolderCache(folder)}>
      {children}
    </Link>
  );
};

export const AppFileLink = ({
  file,
  children,
  isDisabled,
  ...props
}: { file: FileIDandName; isDisabled?: boolean } & Omit<LinkProps, 'href'>) => {
  const href = useAppFileLink(file);
  if (isDisabled) return children;
  return (
    <Link href={href} {...props} onPress={() => addToFileCache(file)}>
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
  item: LinkableFolder | LinkableFile;
  children: ReactNode;
  asChild?: boolean;
}) => {
  if (item.__typename === 'Folder') {
    return (
      <AppFolderLink folder={item} asChild={asChild}>
        {children}
      </AppFolderLink>
    );
  }

  if ('folderId' in item) {
    return (
      <AppFileLink file={item} asChild={asChild}>
        {children}
      </AppFileLink>
    );
  }

  return <>{children}</>;
};

export const useAppFolderLink = (folder: { id: string }): Href => {
  const hostname = useHostname();
  const uuid = useUuid();
  const loggedin = hostname ?? '';

  if (uuid) {
    return {
      pathname: '/[loggedin]/s/[uuid]/[folderId]',
      params: { loggedin, uuid, folderId: folder.id },
    };
  }

  return {
    pathname: '/[loggedin]/admin/f/[folderId]',
    params: { loggedin, folderId: folder.id },
  };
};

export const useAppFileLink = (file: FileIDandName): Href => {
  const hostname = useHostname();
  const uuid = useUuid();
  const loggedin = hostname ?? '';

  if (uuid) {
    return {
      pathname: '/[loggedin]/s/[uuid]/[folderId]/[fileId]',
      params: { loggedin, uuid, folderId: file.folderId, fileId: file.id },
    };
  }

  return {
    pathname: '/[loggedin]/admin/f/[folderId]/[fileId]',
    params: { loggedin, folderId: file.folderId, fileId: file.id },
  };
};
