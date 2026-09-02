import { useAtom, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback } from 'react';
import type { FileSort } from '@shared/files/sortFiles';
import {
  decodeFileSort,
  defaultFileSort,
  encodeFileSort,
} from '@shared/files/sortFiles';
import { themeModeAtom } from '../atoms/themeModeAtom';
import { useHashParam } from './useHashParam';

// Remembers the viewer's own sort choice per-browser (encoded the same way as
// the URL hash and Branding.defaultFileSort). Intentionally NOT a backend field:
// Link users are shared public URLs, so persisting server-side would leak one
// viewer's choice to everyone using the same link.
const fileSortStorageAtom = atomWithStorage<string>('fileSort', '', undefined, {
  getOnInit: true,
});

export const useFileSort = () => {
  const [hash, setHash] = useHashParam('s');
  const [stored, setStored] = useAtom(fileSortStorageAtom);
  const brandingDefault = useAtomValue(themeModeAtom).defaultFileSort;
  const sort = hash
    ? decodeFileSort(hash)
    : stored
      ? decodeFileSort(stored)
      : brandingDefault
        ? decodeFileSort(brandingDefault)
        : defaultFileSort;
  const setSort = useCallback(
    (next: FileSort) => {
      const encoded = encodeFileSort(next);
      setHash(encoded);
      setStored(encoded);
    },
    [setHash, setStored],
  );

  return [sort, setSort] as const;
};
