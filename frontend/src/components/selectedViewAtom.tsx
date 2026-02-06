import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomWithHash } from 'jotai-location';
import { actionIconSize } from '../theme';
import { GridViewIcon, ListViewIcon, PhotoViewIcon } from '../PicrIcons';
import { ReactNode } from 'react';
import { atomWithHashOptions as opts } from '../helpers/atomWithHashOptions';

export type SelectedView = 'list' | 'gallery' | 'feed';

const selectedViewStorageAtom = atomWithStorage<SelectedView>(
  'SelectedView',
  'gallery',
  undefined,
  { getOnInit: true },
);

const selectedViewHashAtom = atomWithHash('v', '', opts);

const viewEncoding: { [key in SelectedView]: string } = {
  list: 'l',
  gallery: 'g',
  feed: 'f',
};

export const selectedViewAtom = atom<SelectedView>(
  (get) => {
    const hash = get(selectedViewHashAtom);
    if (hash) {
      const view = (Object.entries(viewEncoding).find(
        ([, value]) => value === hash,
      )?.[0] ?? 'gallery') as SelectedView;
      return view;
    }
    return get(selectedViewStorageAtom);
  },
  (get, set, next: SelectedView) => {
    set(selectedViewStorageAtom, next);
    set(selectedViewHashAtom, viewEncoding[next]);
  },
);

export const viewOptions: {
  name: SelectedView;
  icon: ReactNode;
  label: string;
}[] = [
  { name: 'list', icon: <ListViewIcon size={actionIconSize} />, label: 'List' },
  {
    name: 'gallery',
    icon: <GridViewIcon size={actionIconSize} />,
    label: 'Gallery',
  },
  {
    name: 'feed',
    icon: <PhotoViewIcon size={actionIconSize} />,
    label: 'Feed',
  },
] as const;
