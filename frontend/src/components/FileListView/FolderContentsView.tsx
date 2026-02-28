import { selectedViewAtom } from '../selectedViewAtom';
import { GridGallery } from './GridGallery';
import { useCallback, useEffect, type MouseEvent } from 'react';
import { ImageFeed } from './ImageFeed';
import { SelectedFileView } from './SelectedFile/SelectedFileView';
import {
  filterAtom,
  filterOptions,
  resetFilterOptions,
} from '@shared/filterAtom';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { FilteringOptions } from './Filtering/FilteringOptions';
import { Transition } from '@mantine/core';
import { useParams } from 'react-router';
import { useSetFolder } from '../../hooks/useSetFolder';
import { FileListView } from './FileListView';
import { fileSortAtom } from '../../atoms/fileSortAtom';
import type {
  ViewFolderFileWithHero,
  ViewFolderSubFolder,
  FolderContentsItem,
} from '@shared/files/folderContentsViewModel';
import {
  folderContentsItems,
  isFolderContentsFile,
} from '@shared/files/folderContentsViewModel';
import type { ViewFolder } from '@shared/files/sortFiles';
import {
  moveRenameFolderAtom,
  useCloseMoveRenameFolderModal,
} from '../../atoms/modalAtom';
import { MoveRenameFolderModal } from './MoveRenameFolderModal';
import { useCanDownload, useMe } from '../../hooks/useMe';

export interface FileListViewStyleComponentProps {
  files: ViewFolderFileWithHero[];
  folders: ViewFolderSubFolder[];
  items?: FolderContentsItem[];
  selectedFileId?: string;
  setSelectedFileId: (id: string | undefined) => void;
  folderId: string;
}

export const FolderContentsView = ({ folder }: { folder: ViewFolder }) => {
  const files = folder.files;
  const folderId = folder.id;
  const { fileId: fileIdParam } = useParams();
  // 'manage' and 'activity' are route segments, not file IDs
  const fileId = ['manage', 'activity'].includes(fileIdParam ?? '')
    ? undefined
    : fileIdParam;
  const setFolder = useSetFolder();
  const [view, setView] = useAtom(selectedViewAtom);
  const me = useMe();
  const branding = folder.branding;

  // For link users: if saved view is not available, switch to defaultView or first shown
  useEffect(() => {
    if (!me?.isLink) return;
    const restricted = branding?.availableViews;
    if (!restricted?.length) return;
    if (!restricted.includes(view)) {
      const next = (branding?.defaultView ?? restricted[0]) as typeof view;
      setView(next);
    }
  }, [
    branding?.availableViews,
    branding?.defaultView,
    me?.isLink,
    view,
    setView,
  ]);

  const filtering = useAtomValue(filterAtom);
  const filters = useAtomValue(filterOptions);
  const resetFilters = useSetAtom(resetFilterOptions);
  const sort = useAtomValue(fileSortAtom);
  const moveFolder = useAtomValue(moveRenameFolderAtom);
  const closeMoveFolderModal = useCloseMoveRenameFolderModal();
  const canDownload = useCanDownload();

  const setSelectedFileId = (fileId: string | undefined) => {
    const file = fileId ? { id: fileId } : undefined;
    setFolder({ id: folderId }, file);
  };

  useEffect(() => resetFilters(), [resetFilters, folderId]);

  const handleContextMenu = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (canDownload) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('img')) {
        event.preventDefault();
      }
    },
    [canDownload],
  );

  // don't memo files because it breaks graphicache (IE: file changing rating won't reflect)
  const sortedItems = folderContentsItems(folder, {
    sort,
    filtering,
    filters,
  });
  const sortedFiles = sortedItems.filter(
    isFolderContentsFile,
  ) as ViewFolderFileWithHero[];
  const sortedFolders = sortedItems.filter(
    (item) => !isFolderContentsFile(item),
  ) as ViewFolderSubFolder[];

  const props = {
    folderId,
    folders: sortedFolders,
    files: sortedFiles,
    items: sortedItems,
    selectedFileId: fileId,
    setSelectedFileId,
  };

  // console.log('FCV render');
  return (
    <div onContextMenu={handleContextMenu}>
      {moveFolder ? (
        <MoveRenameFolderModal
          folder={moveFolder}
          opened={true}
          onClose={closeMoveFolderModal}
        />
      ) : null}
      <Transition
        mounted={filtering}
        transition="scale-y"
        duration={400}
        timingFunction="ease"
      >
        {(style) => (
          <FilteringOptions
            files={files}
            style={style}
            totalFiltered={props.files.length}
          />
        )}
      </Transition>
      {fileId ? ( // SelectedFileView react lightbox 'blocks' fileinfo so we can't have them on at the same time
        <>
          <SelectedFileView
            files={props.files}
            setSelectedFileId={setSelectedFileId}
            selectedFileId={fileId}
            folderId={folderId}
          />
        </>
      ) : null}
      {view === 'list' && <FileListView {...props} />}
      {view === 'gallery' && <GridGallery {...props} />}
      {view === 'feed' && <ImageFeed {...props} />}
    </div>
  );
};
