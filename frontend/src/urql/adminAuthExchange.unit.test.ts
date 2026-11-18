import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getDefaultStore } from 'jotai';
import { Client, fetchExchange, gql } from 'urql';
import { AUTH_REASON } from '@shared/auth/authErrorContract';
import { authKeyAtom } from '../atoms/authAtom';
import { setAdminAccessToken } from '../helpers/adminSession';
import { createAdminAuthExchanges } from './adminAuthExchange';

const store = getDefaultStore();
const serverNow = Date.now();
const jwt = (issued: number, expires: number) =>
  `header.${btoa(JSON.stringify({ userId: 1, iat: issued / 1000, exp: expires / 1000 }))}.signature`;
const expiredOnServer = jwt(serverNow - 16 * 60_000, serverNow - 60_000);
const fresh = jwt(serverNow, serverNow + 15 * 60_000);
const me = gql`
  query Me {
    me {
      id
    }
    clientInfo {
      baseUrl
    }
  }
`;
const rejection = { data: { me: null, clientInfo: { baseUrl: '/' } } };
const unauthenticated = {
  extensions: { code: 'UNAUTHENTICATED', reason: AUTH_REASON.NOT_LOGGED_IN },
  message: 'Not logged in',
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
const fetchMock = vi.fn<typeof fetch>();
const client = () =>
  new Client({
    url: 'http://localhost/graphql',
    exchanges: [...createAdminAuthExchanges(), fetchExchange],
  });

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(serverNow - 60 * 60_000);
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('navigator', {});
  vi.stubGlobal('window', { location: { pathname: '/admin' } });
  vi.stubGlobal('document', {
    baseURI: 'http://localhost/',
    visibilityState: 'visible',
  });
  setAdminAccessToken(expiredOnServer);
});
afterEach(() => {
  store.set(authKeyAtom, '');
  fetchMock.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('a server-rejected bootstrap query refreshes once despite a slow browser clock', async () => {
  fetchMock
    .mockResolvedValueOnce(json(rejection))
    .mockResolvedValueOnce(json({ accessToken: fresh }))
    .mockResolvedValueOnce(json({ data: { me: { id: '1' } } }));
  const result = await client().query(me, {}).toPromise();
  expect(result.data).toEqual({ me: { id: '1' } });
  expect(result.error).toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
  expect(
    new Headers(fetchMock.mock.calls[2][1]?.headers).get('authorization'),
  ).toBe(`Bearer ${fresh}`);
  expect(store.get(authKeyAtom)).toBe(fresh);
});
test('a second authentication rejection is returned without a refresh loop', async () => {
  fetchMock
    .mockResolvedValueOnce(json(rejection))
    .mockResolvedValueOnce(json({ accessToken: fresh }))
    .mockResolvedValueOnce(json(rejection));
  const result = await client().query(me, {}).toPromise();
  expect(result.data).toEqual(rejection.data);
  expect(result.error?.graphQLErrors[0].extensions['reason']).toBe(
    AUTH_REASON.NOT_LOGGED_IN,
  );
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
test('partially successful mutations are never replayed', async () => {
  const payload = {
    data: { edited: { id: '3' }, failed: null },
    errors: [unauthenticated],
  };
  fetchMock.mockResolvedValueOnce(json(payload));
  const result = await client()
    .mutation(
      gql`
        mutation Edit {
          edited: editFolder(id: "3") {
            id
          }
          failed: editUser(id: "4") {
            id
          }
        }
      `,
      {},
    )
    .toPromise();
  expect(result.data).toEqual(payload.data);
  expect(result.error).toBeDefined();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('a mutation rejected before returning any data can refresh and retry', async () => {
  fetchMock
    .mockResolvedValueOnce(json({ errors: [unauthenticated] }))
    .mockResolvedValueOnce(json({ accessToken: fresh }))
    .mockResolvedValueOnce(json({ data: { editFolder: { id: '3' } } }));
  const result = await client()
    .mutation(
      gql`
        mutation Edit {
          editFolder(id: "3") {
            id
          }
        }
      `,
      {},
    )
    .toPromise();
  expect(result.error).toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
test('permission denials do not trigger session refresh', async () => {
  fetchMock.mockResolvedValueOnce(
    json({
      errors: [{ extensions: { code: 'FORBIDDEN' }, message: 'Forbidden' }],
    }),
  );
  await client().query(me, {}).toPromise();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('a definitively expired refresh session clears authentication', async () => {
  fetchMock
    .mockResolvedValueOnce(json(rejection))
    .mockResolvedValueOnce(json({ error: 'session_expired' }, 401))
    .mockResolvedValueOnce(json(rejection));
  const result = await client().query(me, {}).toPromise();
  expect(result.error).toBeDefined();
  expect(store.get(authKeyAtom)).toBe('');
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(
    new Headers(fetchMock.mock.calls[2][1]?.headers).get('authorization'),
  ).toBe('');
});
test('public-gallery operations bypass admin headers and refresh', async () => {
  vi.stubGlobal('window', { location: { pathname: '/s/example/1' } });
  vi.mocked(performance.now).mockReturnValue(20 * 60_000);
  fetchMock.mockResolvedValueOnce(json(rejection));
  const result = await client().query(me, {}).toPromise();
  expect(result.error).toBeUndefined();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(
    new Headers(fetchMock.mock.calls[0][1]?.headers).has('authorization'),
  ).toBe(false);
});
test('concurrent operations queue behind one proactive refresh', async () => {
  vi.mocked(performance.now).mockReturnValue(20 * 60_000);
  const refresh = Promise.withResolvers<Response>();
  fetchMock
    .mockImplementationOnce(() => refresh.promise)
    .mockImplementation(async () => json({ data: { one: 1, two: 2 } }));
  const api = client();
  const first = api
    .query(
      gql`
        query One {
          one
        }
      `,
      {},
    )
    .toPromise();
  const second = api
    .query(
      gql`
        query Two {
          two
        }
      `,
      {},
    )
    .toPromise();
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/refresh');
  refresh.resolve(json({ accessToken: fresh }));
  const results = await Promise.all([first, second]);
  expect(results.every((result) => !result.error)).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
test('a fast browser clock does not refresh on each request', async () => {
  vi.mocked(Date.now).mockReturnValue(serverNow + 60 * 60_000);
  setAdminAccessToken(fresh);
  fetchMock.mockImplementation(async () => json({ data: { one: 1, two: 2 } }));
  const api = client();
  await api
    .query(
      gql`
        query One {
          one
        }
      `,
      {},
    )
    .toPromise();
  await api
    .query(
      gql`
        query Two {
          two
        }
      `,
      {},
    )
    .toPromise();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(
    fetchMock.mock.calls.every(([url]) => url !== '/api/auth/refresh'),
  ).toBe(true);
});
test('transient refresh failures preserve the current session', async () => {
  fetchMock
    .mockResolvedValueOnce(json(rejection))
    .mockResolvedValueOnce(
      new Response('<html>Unavailable</html>', { status: 503 }),
    );
  const result = await client().query(me, {}).toPromise();
  expect(result.error?.networkError).toBeDefined();
  expect(store.get(authKeyAtom)).toBe(expiredOnServer);
});
