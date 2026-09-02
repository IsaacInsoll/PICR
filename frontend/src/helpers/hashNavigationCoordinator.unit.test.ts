import { describe, expect, test } from 'vitest';
import { withFileModalState } from './fileModalHash';
import { createHashNavigationCoordinator } from './hashNavigationCoordinator';
import { withHashParam } from './hashParams';

describe('hash navigation coordinator', () => {
  test('composes consecutive hash writes before the Router location updates', () => {
    const coordinator = createHashNavigationCoordinator({
      pathname: '/admin/f/5',
      search: '',
      hash: '',
      state: { existing: true },
    });

    coordinator.update((location) => ({
      hash: withHashParam(location.hash, 's', 'da'),
      replace: true,
      state: location.state,
    }));
    const modalNavigation = coordinator.update((location) => ({
      hash: withFileModalState(location.hash, {
        mode: 'comments',
        fileId: '42',
      }),
      replace: false,
      state: { fileModalOpened: true },
    }));
    const viewNavigation = coordinator.update((location) => ({
      hash: withHashParam(location.hash, 'v', 'l'),
      replace: true,
      state: location.state,
    }));

    expect(modalNavigation.to.hash).toBe('#s=da&m=comments-42');
    expect(viewNavigation).toEqual({
      to: {
        pathname: '/admin/f/5',
        search: '',
        hash: '#s=da&m=comments-42&v=l',
      },
      replace: true,
      state: { fileModalOpened: true },
    });
  });

  test('resynchronizes after Router navigation such as Back', () => {
    const coordinator = createHashNavigationCoordinator({
      pathname: '/admin/f/5',
      search: '',
      hash: '#m=info-42',
      state: { fileModalOpened: true },
    });

    coordinator.sync({
      pathname: '/admin/f/5',
      search: '',
      hash: '#s=da',
      state: null,
    });

    expect(coordinator.current()).toEqual({
      pathname: '/admin/f/5',
      search: '',
      hash: '#s=da',
      state: null,
    });
  });
});
