import { ViewFolderQuery } from '@shared/gql/graphql';
import { AppFolderFeed } from '@/src/components/FolderContents/AppFolderFeed';
import { File } from '@shared/gql/graphql';
import { useAtomValue } from 'jotai';
import { folderViewModeAtom } from '@/src/atoms/atoms';
import { AppFolderFileList } from '@/src/components/FolderContents/AppFolderFileList';

export const AppFolderContentsView = ({
  folder,
  files,
  width,
}: {
  folder: ViewFolderQuery['folder'];
  files: File[];
  width: number;
}) => {
  const items = [...folder.subFolders, ...files];
  const view = useAtomValue(folderViewModeAtom);
  /*
  This is what the frontend has currently and we should support similar:
    list: FileListView
    gallery: GridGallery
    slideshow: ImageFeed
  */
  switch (view) {
    case 'gallery':
      return <AppFolderFeed items={items} width={width} />;
    case 'feed':
      return <AppFolderFeed items={items} width={width} />;
    case 'list':
      return <AppFolderFileList items={items} width={width} />;
  }
};
