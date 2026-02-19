import { atom } from 'jotai';
import { atomWithHashOptions as opts } from '../helpers/atomWithHashOptions';
import { atomWithHash } from 'jotai-location';
import { FileSort, FileSortType } from '@shared/files/sortFiles';

const fileSortHashAtom = atomWithHash('s', '', opts);

export const fileSortAtom = atom<FileSort, [FileSort], void>(
  (get) => {
    const sort = get(fileSortHashAtom);
    if (!sort) return { type: 'Filename', direction: 'Asc' };
    const typeEntry = Object.entries(fileSortEncoding).find(
      ([, v]) => v === sort[0],
    );
    const type = (typeEntry?.[0] as FileSortType | undefined) ?? 'Filename';
    const direction = sort[1] == 'a' ? 'Asc' : 'Desc';
    return { type, direction };
  },
  (get, set, args: FileSort) => {
    set(
      fileSortHashAtom,
      fileSortEncoding[args.type] + (args.direction == 'Asc' ? 'a' : ''),
    );
  },
);

const fileSortEncoding: { [key in FileSortType]: string } = {
  Filename: 'f',
  LastModified: 'm',
  RecentlyCommented: 'c',
  Rating: 'r',
};
