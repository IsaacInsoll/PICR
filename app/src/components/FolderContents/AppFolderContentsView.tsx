import { ViewFolderQuery } from '@shared/gql/graphql';
import { AppFolderFeed } from '@/src/components/FolderContents/AppFolderFeed';

export const AppFolderContentsView = ({
  folder,
  width,
}: {
  folder: ViewFolderQuery['folder'];
  width: number;
}) => {
  const items = [...folder.subFolders, ...folder.files];

  /*
  This is what the frontend has currently and we should support similar:
    list: FileListView
    gallery: GridGallery
    slideshow: ImageFeed
  */
  return <AppFolderFeed items={items} width={width} />;
};
