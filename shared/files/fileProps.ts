import type { PicrFile, PicrFolder } from '@shared/types/picr';

type FileOrFolderLike = Pick<PicrFile, '__typename' | 'type'> &
  Pick<PicrFolder, 'heroImage'>;

// TODO: replace all occurrences of file.type == <something> with this :)
export const fileProps = (file: FileOrFolderLike) => {
  const isFolder = file.__typename === 'Folder';
  return {
    isFolder,
    heroImage: isFolder ? file.heroImage : undefined,
    isVideo: 'type' in file && file.type === 'Video',
    isImage: 'type' in file && file.type === 'Image',
  };
};
