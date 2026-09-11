import { describe, expect, test } from 'vitest';
import { withFileModalState } from './fileModalHash';
import { createLocationNavigationCoordinator } from './locationNavigationCoordinator';
import { withHashParam } from './hashParams';

describe('location navigation coordinator', () => {
  test('composes consecutive hash writes before the Router location updates', () => {
    const coordinator = createLocationNavigationCoordinator({
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

  test('composes same-tick query and hash writes', () => {
    const coordinator = createLocationNavigationCoordinator({
      pathname: '/admin/f/5',
      search: '?link=12',
      hash: '#v=g',
      state: null,
    });

    coordinator.update((location) => {
      const search = new URLSearchParams(location.search);
      search.set('media', 'video');
      return {
        search: `?${search.toString()}`,
        replace: true,
        state: location.state,
      };
    });
    const pending = coordinator.update((location) => ({
      hash: withFileModalState(location.hash, {
        mode: 'info',
        fileId: '42',
      }),
      replace: false,
      state: { fileModalOpened: true },
    }));

    expect(pending).toEqual({
      to: {
        pathname: '/admin/f/5',
        search: '?link=12&media=video',
        hash: '#v=g&m=info-42',
      },
      replace: false,
      state: { fileModalOpened: true },
    });
  });

  test('resynchronizes after Router navigation such as Back', () => {
    const coordinator = createLocationNavigationCoordinator({
      pathname: '/admin/f/5',
      search: '?link=12',
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
