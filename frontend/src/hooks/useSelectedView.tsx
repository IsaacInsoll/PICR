import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback, type ReactNode } from 'react';
import type { SelectedView } from '@shared/types/ui';
import { actionIconSize } from '../theme';
import { GridViewIcon, ListViewIcon, PhotoViewIcon } from '../PicrIcons';
import { useHashParam } from './useHashParam';

const selectedViewStorageAtom = atomWithStorage<SelectedView>(
  'SelectedView',
  'gallery',
  undefined,
  { getOnInit: true },
);

const viewEncoding: { [key in SelectedView]: string } = {
  list: 'l',
  gallery: 'g',
  feed: 'f',
};

export const useSelectedView = () => {
  const [hash, setHash] = useHashParam('v');
  const [stored, setStored] = useAtom(selectedViewStorageAtom);
  const view = hash
    ? ((Object.entries(viewEncoding).find(([, value]) => value === hash)?.[0] ??
        'gallery') as SelectedView)
    : stored;
  const setView = useCallback(
    (next: SelectedView) => {
      setHash(viewEncoding[next]);
      setStored(next);
    },
    [setHash, setStored],
  );

  return [view, setView] as const;
};

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
