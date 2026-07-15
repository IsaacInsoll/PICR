import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
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

// Remembers the viewer's own sort choice per-browser (encoded the same way as
// the URL hash and Branding.defaultFileSort). Intentionally NOT a backend field:
// Link users are shared public URLs, so persisting server-side would leak one
// viewer's choice to everyone using the same link.
const fileSortStorageAtom = atomWithStorage<string>('fileSort', '', undefined, {
  getOnInit: true,
});

// Effective sort precedence: explicit URL-hash sort > this browser's remembered
// choice > the active Branding's defaultFileSort > app default (Filename
// ascending). The Branding is mirrored into themeModeAtom by ViewFolder, so the
// selector and the gallery stay in sync.
export const fileSortAtom = atom<FileSort, [FileSort], void>(
  (get) => {
    const hash = get(fileSortHashAtom);
    if (hash) return decodeFileSort(hash);
    const stored = get(fileSortStorageAtom);
    if (stored) return decodeFileSort(stored);
    const brandingDefault = get(themeModeAtom).defaultFileSort;
    if (brandingDefault) return decodeFileSort(brandingDefault);
    return defaultFileSort;
  },
  (get, set, args: FileSort) => {
    const encoded = encodeFileSort(args);
    set(fileSortHashAtom, encoded);
    set(fileSortStorageAtom, encoded);
  },
);
