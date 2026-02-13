import { Folder, File } from '@shared/gql/graphql';
import { AppFolderFeed } from '@/src/components/FolderContents/AppFolderFeed';
import { useAtomValue } from 'jotai';
import { folderViewModeAtom } from '@/src/atoms/atoms';
import { AppFolderFileList } from '@/src/components/FolderContents/AppFolderFileList';
import { AppFolderGalleryList } from '@/src/components/FolderContents/AppFolderGalleryList';

interface AppFolderContentsViewProps {
  items: (File | Folder)[];
  width: number;
  refresh: () => void;
  ListHeaderComponent?: React.ReactElement | null;
}

export interface AppFolderContentsViewChildProps {
  items: (File | Folder)[];
  width: number;
  refresh: () => void;
  ListHeaderComponent?: React.ReactElement | null;
}

export const AppFolderContentsView = ({
  items,
  width,
  refresh,
  ListHeaderComponent,
}: AppFolderContentsViewProps) => {
  const view = useAtomValue(folderViewModeAtom);
  /*
  This is what the frontend has currently and we should support similar:
    list: FileListView
    gallery: GridGallery
    slideshow: ImageFeed
  */
  switch (view) {
    case 'gallery':
      return (
        <AppFolderGalleryList
          items={items}
          width={width}
          colCount={2}
          refresh={refresh}
          ListHeaderComponent={ListHeaderComponent}
        />
      );
    case 'gallery2':
      return (
        <AppFolderGalleryList
          items={items}
          width={width}
          colCount={3}
          refresh={refresh}
          ListHeaderComponent={ListHeaderComponent}
        />
      );
    case 'feed':
      return (
        <AppFolderFeed
          items={items}
          width={width}
          refresh={refresh}
          ListHeaderComponent={ListHeaderComponent}
        />
      );
    case 'list':
      return (
        <AppFolderFileList
          items={items}
          width={width}
          refresh={refresh}
          ListHeaderComponent={ListHeaderComponent}
        />
      );
  }
};
