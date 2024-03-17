import { MinimalFile } from '../../../types';
import { useSelectedView, ViewSelector } from '../ViewSelector';
import { GridGallery } from './GridGallery';
import { DataGrid } from './DataGrid';
import { useState } from 'react';
import { ImageFeed } from './ImageFeed';
import { SelectedFileView } from './SelectedFileView';
import { filterAtom, filterOptions } from '../../atoms/filterAtom';
import { useAtomValue } from 'jotai';
import { FilteringOptions } from './Filtering/FilteringOptions';
import { filterFiles } from '../../helpers/filterFiles';

export interface FileListViewProps {
  files: MinimalFile[];
}

export interface FileListViewStyleComponentProps {
  files: MinimalFile[];
  selectedFileId?: string;
  setSelectedFileId: (id: string | undefined) => void;
}

export const FileListView = ({ files }: FileListViewProps) => {
  const view = useSelectedView();
  const filtering = useAtomValue(filterAtom);
  const filters = useAtomValue(filterOptions);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(
    undefined,
  );
  if (!files || files.length === 0) return undefined;
  const filteredFiles = filtering ? filterFiles(files, filters) : files;
  const props = { files: filteredFiles, selectedFileId, setSelectedFileId };
  return (
    <>
      <ViewSelector />
      {filtering ? <FilteringOptions files={files} /> : null}
      {selectedFileId ? (
        <SelectedFileView
          files={filteredFiles}
          setSelectedFileId={setSelectedFileId}
          selectedFileId={selectedFileId}
        />
      ) : null}
      {view === 'list' ? <DataGrid {...props} /> : null}
      {view === 'gallery' ? <GridGallery {...props} /> : null}
      {view === 'slideshow' ? <ImageFeed {...props} /> : null}
    </>
  );
};
