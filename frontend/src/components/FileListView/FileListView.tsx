import { MinimalFile } from '../../../types';
import { useSelectedView, ViewSelector } from '../ViewSelector';
import { GridGallery } from './GridGallery';
import { BoringFileListView } from './BoringFileListView';
import { DataGrid } from './DataGrid';

export interface FileListViewProps {
  files: MinimalFile[];
}

export const FileListView = ({ files }: FileListViewProps) => {
  const view = useSelectedView();
  return (
    <>
      <ViewSelector />
      {view === 'list' ? <DataGrid files={files} /> : null}
      {view === 'gallery' ? <GridGallery files={files} /> : null}
      {view === 'slideshow' ? <BoringFileListView files={files} /> : null}
    </>
  );
};
