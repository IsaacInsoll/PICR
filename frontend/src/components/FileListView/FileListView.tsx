import { MinimalFile } from '../../../types';
import { useSelectedView, ViewSelector } from '../ViewSelector';
import { GridGallery } from './GridGallery';
import { BoringFileListView } from './BoringFileListView';
import { DataGrid } from './DataGrid';
import { useState } from 'react';

export interface FileListViewProps {
  files: MinimalFile[];
}

export interface FileListViewStyleComponentProps {
  files: MinimalFile[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}

export const FileListView = ({ files }: FileListViewProps) => {
  const view = useSelectedView();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const props = { files, selectedIds, setSelectedIds };
  if (!files || files.length === 0) return undefined;
  return (
    <>
      <ViewSelector />
      {view === 'list' ? <DataGrid {...props} /> : null}
      {view === 'gallery' ? <GridGallery {...props} /> : null}
      {view === 'slideshow' ? <BoringFileListView {...props} /> : null}
    </>
  );
};

//perhaps option 3 should be full width single images sorta like an instagram feed
