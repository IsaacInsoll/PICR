import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomWithHash } from 'jotai-location';
import { actionIconSize } from '../theme';
import { GridViewIcon, ListViewIcon, PhotoViewIcon } from '../PicrIcons';
import type { ReactNode } from 'react';
import { atomWithHashOptions as opts } from '../helpers/atomWithHashOptions';
import type { SelectedView } from '@shared/types/ui';

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

export const selectedViewAtom = atom<SelectedView, [SelectedView], void>(
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
  key: SelectedView;
  icon: ReactNode;
  labelKey: 'view.list' | 'view.gallery' | 'view.feed';
}[] = [
  {
    key: 'list',
    icon: <ListViewIcon size={actionIconSize} />,
    labelKey: 'view.list',
  },
  {
    key: 'gallery',
    icon: <GridViewIcon size={actionIconSize} />,
    labelKey: 'view.gallery',
  },
  {
    key: 'feed',
    icon: <PhotoViewIcon size={actionIconSize} />,
    labelKey: 'view.feed',
  },
] as const;
