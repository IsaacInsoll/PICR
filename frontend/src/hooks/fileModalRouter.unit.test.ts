import { createMemoryRouter } from 'react-router';
import { describe, expect, test } from 'vitest';
import {
  fileModalHistoryState,
  withFileModalState,
} from '../helpers/fileModalHash';
import { withHashParam } from '../helpers/hashParams';

describe('file modal Router history', () => {
  test('preserves sort and view state while Back closes an opened modal', async () => {
    const router = createMemoryRouter([{ path: '*', element: null }], {
      initialEntries: ['/admin/f/5'],
    });

    await router.navigate(
      {
        hash: withHashParam(router.state.location.hash, 'v', 'l'),
      },
      { replace: true, state: router.state.location.state },
    );
    await router.navigate(
      {
        hash: withHashParam(router.state.location.hash, 's', 'da'),
      },
      { replace: true, state: router.state.location.state },
    );

    const preferenceHash = router.state.location.hash;
    await router.navigate(
      {
        hash: withFileModalState(preferenceHash, {
          mode: 'comments',
          fileId: '42',
        }),
      },
      { state: fileModalHistoryState(router.state.location.state) },
    );

    expect(router.state.location.hash).toBe('#v=l&s=da&m=comments-42');

    await router.navigate(-1);

    expect(router.state.location.hash).toBe(preferenceHash);
    expect(router.state.location.hash).toBe('#v=l&s=da');
  });

  test('switches an open modal with replace instead of adding history', async () => {
    const router = createMemoryRouter([{ path: '*', element: null }], {
      initialEntries: ['/admin', '/admin#m=comments-42'],
      initialIndex: 1,
    });

    await router.navigate(
      {
        hash: withFileModalState(router.state.location.hash, {
          mode: 'info',
          fileId: '42',
        }),
      },
      { replace: true, state: router.state.location.state },
    );
    expect(router.state.location.hash).toBe('#m=info-42');

    await router.navigate(-1);
    expect(router.state.location.hash).toBe('');
  });
});
