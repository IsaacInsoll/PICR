import { atom } from 'jotai';
import { atomWithHashOptions as opts } from '../helpers/atomWithHashOptions';
import { atomWithHash } from 'jotai-location';
import type { FileSort } from '@shared/files/sortFiles';
import {
  decodeFileSort,
  defaultFileSort,
  encodeFileSort,
} from '@shared/files/sortFiles';
import { themeModeAtom } from './themeModeAtom';

export const fileSortHashAtom = atomWithHash('s', '', opts);

// Effective sort precedence: explicit URL-hash sort > the active Branding's
// defaultFileSort > app default (Filename ascending). The Branding is mirrored
// into themeModeAtom by ViewFolder, so the selector and the gallery stay in sync.
export const fileSortAtom = atom<FileSort, [FileSort], void>(
  (get) => {
    const sort = get(fileSortHashAtom);
    if (sort) return decodeFileSort(sort);
    const brandingDefault = get(themeModeAtom).defaultFileSort;
    if (brandingDefault) return decodeFileSort(brandingDefault);
    return defaultFileSort;
  },
  (get, set, args: FileSort) => {
    set(fileSortHashAtom, encodeFileSort(args));
  },
);
