import { MinimalFile, MinimalFolder } from '../../../types';
import { selectedViewAtom, viewOptions } from '../ViewSelector';
import { GridGallery } from './GridGallery';
import { FileDataListView } from './FileDataListView';
import { useEffect, useMemo } from 'react';
import { ImageFeed } from './ImageFeed';
import { SelectedFileView } from './SelectedFile/SelectedFileView';
import {
  filterAtom,
  filterOptions,
  resetFilterOptions,
} from '../../atoms/filterAtom';
import { useAtomValue } from 'jotai';
import { FilteringOptions } from './Filtering/FilteringOptions';
import { filterFiles, sortFiles } from '../../helpers/filterFiles';
import { useAtom, useSetAtom } from 'jotai/index';
import { Tabs, Transition } from '@mantine/core';
import { Page } from '../Page';
import { useParams } from 'react-router';
import { useSetFolder } from '../../hooks/useSetFolder';
import { FolderRouteParams } from '../../Router';
import { FileListView } from './FileListView';
import { fileSortAtom } from '../../atoms/fileSortAtom';

export interface FileListViewProps {
  files: MinimalFile[];
  folderId: string;
}

export interface FileListViewStyleComponentProps {
  files: MinimalFile[];
  folders: MinimalFolder[];
  selectedFileId?: string;
  setSelectedFileId: (id: string | undefined) => void;
  folderId: string;
}

export const FolderContentsView = ({ folder }) => {
  const files = folder.files;
  const folderId = folder.id;
  const { fileId } = useParams<FolderRouteParams>();
  const setFolder = useSetFolder();
  const [view, setView] = useAtom(selectedViewAtom);
  const filtering = useAtomValue(filterAtom);
  const filters = useAtomValue(filterOptions);
  const resetFilters = useSetAtom(resetFilterOptions);
  const sort = useAtomValue(fileSortAtom);

  const setSelectedFileId = (fileId: string | undefined) => {
    const file = fileId ? { id: fileId } : undefined;
    setFolder({ id: folderId }, file);
  };

  useEffect(() => resetFilters(null), [resetFilters, folderId]);

  // don't memo files because it breaks graphicache (IE: file changing rating won't reflect)
  const filteredFiles = filtering ? filterFiles(files, filters) : files;
  const sortedFiles = sortFiles(filteredFiles, sort);

  const withProps = sortedFiles.map((f) => {
    return { ...f, isHeroImage: f.id == folder.heroImage?.id };
  });

  const props = {
    folderId,
    folders: folder.subFolders,
    files: withProps,
    selectedFileId: fileId,
    setSelectedFileId,
  };

  // console.log('FCV render');
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
      <Tabs value={view} onChange={setView} keepMounted={false}>
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
        <Tabs.Panel value="slideshow">
          <ImageFeed {...props} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
};
