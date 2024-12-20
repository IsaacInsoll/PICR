import { atom } from 'jotai/index';
import { atomWithHashOptions as opts } from '../helpers/atomWithHashOptions';
import { atomWithHash } from 'jotai-location';

type FileSortType =
  | 'Filename'
  | 'LastModified'
  | 'RecentlyCommented'
  | 'Rating';
type FileSortDirection = 'Asc' | 'Desc';

export interface FileSort {
  type: FileSortType;
  direction: FileSortDirection;
}

const fileSortHashAtom = atomWithHash('s', '', opts);

export const fileSortAtom = atom<FileSort>(
  (get) => {
    const sort = get(fileSortHashAtom);
    if (!sort) return { type: 'Filename', direction: 'Asc' };
    const type =
      Object.entries(fileSortEncoding).find(([k, v]) => v == sort[0])[0] ??
      'Filename';
    const direction = sort[1] == 'a' ? 'Asc' : 'Desc';
    console.log({ type, direction });
    return { type, direction };
  },
  (get, set, args: FileSort) => {
    console.log(args);
    set(
      fileSortHashAtom,
      fileSortEncoding[args.type] + (args.direction == 'Asc' ? 'a' : ''),
    );
  },
);

const fileSortEncoding: { [key: FileSortType]: string } = {
  Filename: 'f',
  LastModified: 'm',
  RecentlyCommented: 'c',
  Rating: 'r',
};
