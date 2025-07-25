import { ViewFolderQuery } from '@shared/gql/graphql';
import { AppFolderFeed } from '@/src/components/FolderContents/AppFolderFeed';
import { File } from '@shared/gql/graphql';

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

  /*
  This is what the frontend has currently and we should support similar:
    list: FileListView
    gallery: GridGallery
    slideshow: ImageFeed
  */
  return <AppFolderFeed items={items} width={width} />;
};
