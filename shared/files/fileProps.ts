import { File, Folder } from '@/gql/graphql';

// TODO: replace all occurrences of file.type == <something> with this :)
export const fileProps = (file: File | Folder) => {
  return {
    isFolder: file.__typename === 'Folder',
    heroImage: file.heroImage,
    isVideo: file?.type === 'Video',
    isImage: file?.type === 'Image',
  };
};
