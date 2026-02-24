import type { PicrFile, PicrFolder } from './picr.js';

export type SelectedView = 'list' | 'gallery' | 'feed';

export type MobileSelectedView = SelectedView | 'gallery2';

export type TitleLevel = 1 | 2 | 3 | 4;

export type FolderNavigationTarget = Pick<PicrFolder, 'id'> &
  Partial<PicrFolder>;

export type FileIdTarget = Pick<PicrFile, 'id'>;

export type FileNavigationTarget = FileIdTarget | string;

export type ImageUrlFileInput = Partial<
  Pick<PicrFile, 'id' | 'fileHash' | 'name' | 'type'>
>;

export type LinkableFolderItem = Pick<PicrFolder, 'title'> & {
  __typename: 'Folder';
  id: string;
  name: string;
};

export type LinkableFileItem = Pick<PicrFile, '__typename'> & {
  id: string;
  name: string;
  folderId: string;
};

export type LinkableItem = LinkableFolderItem | LinkableFileItem;

export type ThumbnailMediaItem = Pick<
  PicrFile,
  | '__typename'
  | 'id'
  | 'fileHash'
  | 'name'
  | 'type'
  | 'folderId'
  | 'imageRatio'
  | 'blurHash'
> & { name?: string };

export type ThumbnailFolderItem = Pick<
  PicrFolder,
  'id' | 'name' | 'heroImage'
> & {
  __typename: 'Folder';
  name: string;
};

export type ThumbnailItem = ThumbnailMediaItem | ThumbnailFolderItem;
