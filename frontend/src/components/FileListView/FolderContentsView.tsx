import { MinimalFile } from '../../../types';
import {
  selectedViewAtom,
  useSelectedView,
  viewOptions,
} from '../ViewSelector';
import { GridGallery } from './GridGallery';
import { FileDataListView } from './FileDataListView';
import { useEffect, useState } from 'react';
import { ImageFeed } from './ImageFeed';
import { SelectedFileView } from './SelectedFileView';
import {
  filterAtom,
  filterOptions,
  resetFilterOptions,
} from '../../atoms/filterAtom';
import { useAtomValue } from 'jotai';
import { FilteringOptions } from './Filtering/FilteringOptions';
import { filterFiles } from '../../helpers/filterFiles';
import { useAtom, useSetAtom } from 'jotai/index';
import { Tabs } from '@mantine/core';
import { Page } from '../Page';

export interface FileListViewProps {
  files: MinimalFile[];
  folderId: string;
}

export interface FileListViewStyleComponentProps {
  files: MinimalFile[];
  selectedFileId?: string;
  setSelectedFileId: (id: string | undefined) => void;
}

export const FolderContentsView = ({ files, folderId }: FileListViewProps) => {
  const [view, setView] = useAtom(selectedViewAtom);
  const filtering = useAtomValue(filterAtom);
  const filters = useAtomValue(filterOptions);
  const resetFilters = useSetAtom(resetFilterOptions);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(
    undefined,
  );
  useEffect(() => resetFilters(null), [resetFilters, folderId]);
  if (!files || files.length === 0) return undefined;
  const filteredFiles = filtering ? filterFiles(files, filters) : files;
  const props = { files: filteredFiles, selectedFileId, setSelectedFileId };
  return (
    <>
      {filtering ? <FilteringOptions files={files} /> : null}
      {selectedFileId ? (
        <SelectedFileView
          files={filteredFiles}
          setSelectedFileId={setSelectedFileId}
          selectedFileId={selectedFileId}
        />
      ) : null}
      <Tabs value={view} onChange={setView}>
        <Page>
          <Tabs.List grow>
            {viewOptions.map((v) => (
              <Tabs.Tab value={v.name} leftSection={v.icon}>
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
