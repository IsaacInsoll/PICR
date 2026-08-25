import type { Href, LinkProps } from 'expo-router';
import { Link } from 'expo-router';
import { useHostname, useUuid } from '@/src/hooks/useHostname';
import type { FileIDandName, FolderIDandName } from '@/src/helpers/folderCache';
import { addToFileCache, addToFolderCache } from '@/src/helpers/folderCache';
import type { ReactNode } from 'react';
import type { LinkableItem } from '@shared/types/ui';
import { adminFileHref, adminFolderHref } from '@/src/helpers/appRoutes';

export const AppFolderLink = ({
  folder,
  children,
  ...props
}: { folder: FolderIDandName } & Omit<LinkProps, 'href'>) => {
  const href = useAppFolderLink(folder);
  return (
    <Link
      testID={`folder-link-${folder.id}`}
      href={href}
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
  isDisabled,
  ...props
}: { file: FileIDandName; isDisabled?: boolean } & Omit<LinkProps, 'href'>) => {
  const href = useAppFileLink(file);
  if (isDisabled) return children;
  return (
    <Link
      testID={`file-link-${file.id}`}
      href={href}
      {...props}
      onPress={() => addToFileCache(file)}
    >
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
  item: LinkableItem;
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

  return adminFolderHref(loggedin, folder.id);
};

export const useAppFileLink = (file: FileIDandName): Href => {
  const hostname = useHostname();
  const uuid = useUuid();
  const loggedin = hostname ?? '';

  if (uuid) {
    return `/${loggedin}/s/${uuid}/${file.folderId}/${file.id}`;
  }

  return adminFileHref(loggedin, file.folderId, file.id);
};
