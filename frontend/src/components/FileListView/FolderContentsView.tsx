import { selectedViewAtom, viewOptions } from '../selectedViewAtom';
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
import { Tabs, Transition } from '@mantine/core';
import { Page } from '../Page';
import { useParams } from 'react-router';
import { useSetFolder } from '../../hooks/useSetFolder';
import { FileListView } from './FileListView';
import { fileSortAtom } from '../../atoms/fileSortAtom';
import {
  ViewFolderFileWithHero,
  ViewFolderSubFolder,
  FolderContentsItem,
  folderContentsItems,
  isFolderContentsFile,
} from '@shared/files/folderContentsViewModel';
import { ViewFolder } from '@shared/files/sortFiles';
import {
  moveRenameFolderAtom,
  useCloseMoveRenameFolderModal,
} from '../../atoms/modalAtom';
import { MoveRenameFolderModal } from './MoveRenameFolderModal';
import { useCanDownload } from '../../hooks/useMe';

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
  const { fileId } = useParams();
  const setFolder = useSetFolder();
  const [view, setView] = useAtom(selectedViewAtom);
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
      <Tabs
        value={view}
        onChange={(next) => {
          if (next) setView(next as typeof view);
        }}
        keepMounted={false}
      >
        <Page>
          <Tabs.List grow mb="xs">
            {viewOptions.map((v) => (
              <Tabs.Tab value={v.name} leftSection={v.icon} key={v.name}>
                {v.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Page>

        <Tabs.Panel value="list">
          <FileListView {...props} />
        </Tabs.Panel>
        <Tabs.Panel value="gallery">
          <GridGallery {...props} />
        </Tabs.Panel>
        <Tabs.Panel value="feed">
          <ImageFeed {...props} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};
