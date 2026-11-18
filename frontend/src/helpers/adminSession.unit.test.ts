import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getDefaultStore } from 'jotai';
import { authKeyAtom } from '../atoms/authAtom';
import {
  authRequest,
  AuthRequestError,
  restoreAdminSession,
} from './adminSession';

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('window', { location: { pathname: '/admin' } });
  vi.stubGlobal('document', {
    baseURI: 'http://localhost/',
    visibilityState: 'visible',
  });
  vi.stubGlobal('localStorage', { removeItem: vi.fn() });
});
afterEach(() => {
  getDefaultStore().set(authKeyAtom, '');
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

test('non-JSON proxy errors become typed errors and do not reject startup restoration', async () => {
  fetchMock.mockResolvedValueOnce(
    new Response('<html>Bad gateway</html>', { status: 502 }),
  );
  await expect(authRequest('security')).rejects.toMatchObject({
    code: 'server_error',
    status: 502,
  });
  fetchMock.mockResolvedValueOnce(
    new Response('<html>Unavailable</html>', { status: 503 }),
  );
  await expect(restoreAdminSession()).resolves.toBeUndefined();
});
test('unexpected successful HTML is normalized too', async () => {
  fetchMock.mockResolvedValueOnce(
    new Response('<html>Proxy login</html>', { status: 200 }),
  );
  await expect(authRequest('login')).rejects.toBeInstanceOf(AuthRequestError);
});
