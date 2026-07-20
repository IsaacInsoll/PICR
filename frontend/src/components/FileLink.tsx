import type { AnchorProps, ElementProps } from '@mantine/core';
import { Anchor } from '@mantine/core';
import type { MouseEvent, ReactNode } from 'react';
import { useFolderUrl } from '../hooks/useSetFolder';
import { useSelectedFileId } from '../hooks/useSelectedFileId';

// A real link to a file's lightbox URL, so a file can be opened in a new tab,
// middle-clicked, or "copy link address"-ed.
//
// A plain left click is intercepted and routed through useSelectedFileId, which
// stamps the history marker the back button relies on (see the lightbox history
// rules in this file's AGENTS.md). A bare NavLink push would skip that marker
// and reintroduce issue #68. Modified/middle clicks are left to the browser, so
// a new tab opens the file's URL cold - which the lightbox already handles.
//
// Used for images. Videos and other file types keep their plain onClick for now.
export const FileLink = ({
  folderId,
  fileId,
  children,
  ...props
}: {
  folderId: string;
  fileId: string;
  children: ReactNode;
} & AnchorProps &
  ElementProps<'a', keyof AnchorProps | 'href'>) => {
  const folderUrl = useFolderUrl();
  const setSelectedFileId = useSelectedFileId(folderId);
  return (
    <Anchor
      href={folderUrl({ id: folderId }, fileId)}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        if (
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        ) {
          return;
        }
        e.preventDefault();
        setSelectedFileId(fileId);
      }}
      {...props}
    >
      {children}
    </Anchor>
  );
};
