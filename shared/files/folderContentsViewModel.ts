import type { ViewFolderQuery } from '@shared/gql/graphql';
import type {
  SortFolderContentsOptions,
  SortFolderContentsResult,
} from './sortFiles';
import { sortFolderContents } from './sortFiles';
export type { ViewFolderFileWithHero, ViewFolderSubFolder } from './sortFiles';

export type FolderContentsViewModel = SortFolderContentsResult;
export type FolderContentsItem = FolderContentsViewModel['items'][number];
type HasType = { type: string };
export const isFolderContentsFile = <T>(
  item: T | null | undefined,
): item is Extract<T, HasType> =>
  !!item && typeof (item as unknown as HasType).type === 'string';

export const folderContentsViewModel = (
  folder: ViewFolderQuery['folder'],
  options: SortFolderContentsOptions,
): FolderContentsViewModel => sortFolderContents(folder, options);

export const folderContentsItems = (
  folder: ViewFolderQuery['folder'],
  options: SortFolderContentsOptions,
): FolderContentsItem[] => folderContentsViewModel(folder, options).items;
