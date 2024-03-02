import { MinimalFile } from '../../../types';
import { useSelectedView, ViewSelector } from '../ViewSelector';
import { GridGallery } from './GridGallery';
import { DataGrid } from './DataGrid';
import { useState } from 'react';
import { ImageFeed } from './ImageFeed';
import { SelectedFileView } from './SelectedFileView';

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
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(
    undefined,
  );
  const props = { files, selectedFileId, setSelectedFileId };
  if (!files || files.length === 0) return undefined;
  return (
    <>
      <ViewSelector />
      {selectedFileId ? (
        <SelectedFileView
          files={files}
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
