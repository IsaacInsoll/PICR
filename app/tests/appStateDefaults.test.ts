import { describe, expect, it } from '@jest/globals';
import { createStore } from 'jotai';
import {
  dateDisplayRelativeAtom,
  fileSortAtom,
  folderViewModeAtom,
} from '@/src/atoms/atoms';
import { normalizeFontKey } from '@shared/branding/fontRegistry';

describe('app presentation defaults', () => {
  it('starts with the photographer list, filename sort and relative dates', () => {
    const store = createStore();

    expect(store.get(folderViewModeAtom)).toBe('list');
    expect(store.get(fileSortAtom)).toEqual({
      direction: 'Asc',
      type: 'Filename',
    });
    expect(store.get(dateDisplayRelativeAtom)).toBe(true);
  });

  it('falls back to the default heading font for absent or invalid branding', () => {
    expect(normalizeFontKey()).toBe('default');
    expect(normalizeFontKey('not-a-font')).toBe('default');
  });
});
