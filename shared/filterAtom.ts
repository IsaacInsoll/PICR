import { atom } from 'jotai';
import {
  countGalleryFilterCriteria,
  defaultGalleryFilterCriteria,
  type GalleryFilterCriteria,
} from './files/mediaCriteria';

export type FilterOptionsInterface = GalleryFilterCriteria;

export const filterOptions = atom<GalleryFilterCriteria>(
  defaultGalleryFilterCriteria,
);

export const resetFilterOptions = atom(null, (_get, set) => {
  set(filterOptions, defaultGalleryFilterCriteria);
});

export const totalFilterOptionsSelected = atom((get) =>
  countGalleryFilterCriteria(get(filterOptions)),
);

export const totalMetadataFilterOptionsSelected = atom((get) => {
  const { metadata } = get(filterOptions);
  let total = 0;
  Object.entries(metadata).forEach(([, options]) => {
    if (options.length) total++;
  });
  return total;
});
