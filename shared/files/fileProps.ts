import { File, Folder } from '@shared/gql/graphql';

// TODO: replace all occurrences of file.type == <something> with this :)
export const fileProps = (file: File | Folder) => {
  const isFolder = file.__typename === 'Folder';
  return {
    isFolder,
    heroImage: isFolder ? file.heroImage : undefined,
    isVideo: 'type' in file && file.type === 'Video',
    isImage: 'type' in file && file.type === 'Image',
  };
};
