import { MinimalFile } from '../../../types';
import { selectedViewAtom, viewOptions } from '../ViewSelector';
import { GridGallery } from './GridGallery';
import { FileDataListView } from './FileDataListView';
import { useEffect } from 'react';
import { ImageFeed } from './ImageFeed';
import { SelectedFileView } from './SelectedFile/SelectedFileView';
import {
  filterAtom,
  filterOptions,
  resetFilterOptions,
} from '../../atoms/filterAtom';
import { useAtomValue } from 'jotai';
import { FilteringOptions } from './Filtering/FilteringOptions';
import { filterFiles } from '../../helpers/filterFiles';
import { useAtom, useSetAtom } from 'jotai/index';
import { Tabs, Transition } from '@mantine/core';
import { Page } from '../Page';
import { useParams } from 'react-router-dom';
import { useSetFolder } from '../../hooks/useSetFolder';
import { FolderRouteParams } from '../../Router';

export interface FileListViewProps {
  files: MinimalFile[];
  folderId: string;
}

export interface FileListViewStyleComponentProps {
  files: MinimalFile[];
  selectedFileId?: string;
  setSelectedFileId: (id: string | undefined) => void;
  folderId: string;
}

export const FolderContentsView = ({ files, folderId }: FileListViewProps) => {
  const { fileId, fileView } = useParams<FolderRouteParams>();
  const setFolder = useSetFolder();
  const [view, setView] = useAtom(selectedViewAtom);
  const filtering = useAtomValue(filterAtom);
  const filters = useAtomValue(filterOptions);
  const resetFilters = useSetAtom(resetFilterOptions);

  const setSelectedFileId = (fileId: string | undefined) => {
    const file = fileId ? { id: fileId } : undefined;
    setFolder({ id: folderId }, file);
  };

  useEffect(() => resetFilters(null), [resetFilters, folderId]);
  if (!files || files.length === 0) return undefined;
  const filteredFiles = filtering ? filterFiles(files, filters) : files;
  const props = {
    folderId,
    files: filteredFiles,
    selectedFileId: fileId,
    setSelectedFileId,
  };
  return (
    <>
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
            totalFiltered={filteredFiles.length}
          />
        )}
      </Transition>
      {fileId ? ( // SelectedFileView react lightbox 'blocks' fileinfo so we can't have them on at the same time
        <>
          <SelectedFileView
            files={filteredFiles}
            setSelectedFileId={setSelectedFileId}
            selectedFileId={fileId}
            folderId={folderId}
          />
        </>
      ) : null}
      <Tabs value={view} onChange={setView}>
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
          <FileDataListView {...props} />
        </Tabs.Panel>
        <Tabs.Panel value="gallery">
          <GridGallery {...props} />
        </Tabs.Panel>
        <Tabs.Panel value="slideshow">
          <ImageFeed {...props} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
};
