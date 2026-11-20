import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { getDefaultStore } from 'jotai';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Client, fetchExchange, gql } from 'urql';
import {
  clearLoginDetails,
  loginDetailsAtom,
  sessionExpiredAtom,
} from '@/src/hooks/useLoginDetails';
import {
  appSessionIdentity,
  appTokenNeedsRefresh,
  recordAppToken,
  refreshAppSession,
} from '@/src/helpers/appSession';
import { createAppAuthExchanges } from '@/src/helpers/appAuthExchange';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
const store = getDefaultStore();
const fetchMock = jest.fn<typeof fetch>();
const token = (suffix: string) =>
  `header.${btoa(JSON.stringify({ sessionId: 'session', iat: 1000, exp: 1900 }))}.${suffix}`;
const old = token('old');
const fresh = token('fresh');
const login = {
  server: 'https://photos.example/picr/',
  token: old,
  refreshToken: 'refresh',
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
const api = () =>
  new Client({
    url: 'https://photos.example/picr/graphql',
    exchanges: [...createAppAuthExchanges('session'), fetchExchange],
  });
const me = gql`
  query Me {
    me {
      id
    }
  }
`;
const authError = {
  message: 'Not logged in',
  extensions: { code: 'UNAUTHENTICATED', reason: 'NOT_LOGGED_IN' },
};

describe('renewable app sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock;
    store.set(loginDetailsAtom, { ...login });
    store.set(sessionExpiredAtom, false);
    AppState.currentState = 'active';
    recordAppToken(old);
  });
  afterEach(() => {
    jest.restoreAllMocks();
    store.set(loginDetailsAtom, undefined);
  });
  it('queues concurrent proactive GraphQL requests behind one token rotation', async () => {
    jest.spyOn(performance, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER);
    let finish: (value: Response) => void = () => {};
    let started: () => void = () => {};
    const requested = new Promise<void>((resolve) => {
      started = resolve;
    });
    fetchMock
      .mockImplementationOnce(() => {
        started();
        return new Promise<Response>((resolve) => {
          finish = resolve;
        });
      })
      .mockImplementation(async () => json({ data: { one: 1, two: 2 } }));
    const client = api();
    const first = client
      .query(
        gql`
          query One {
            one
          }
        `,
        {},
      )
      .toPromise();
    const second = client
      .query(
        gql`
          query Two {
            two
          }
        `,
        {},
      )
      .toPromise();
    await requested;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://photos.example/picr/api/auth/refresh',
    );
    finish(json({ accessToken: fresh, refreshToken: 'rotated' }));
    expect(
      (await Promise.all([first, second])).every((result) => !result.error),
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(store.get(loginDetailsAtom)?.refreshToken).toBe('rotated');
    expect(appSessionIdentity(fresh)).toBe(appSessionIdentity(old));
    for (const [, options] of fetchMock.mock.calls.slice(1))
      expect(new Headers(options?.headers).get('authorization')).toBe(
        `Bearer ${fresh}`,
      );
  });
  it('recovers bootstrap me:null with one refresh and retry', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ data: { me: null } }))
      .mockResolvedValueOnce(
        json({ accessToken: fresh, refreshToken: 'rotated' }),
      )
      .mockResolvedValueOnce(json({ data: { me: { id: '1' } } }));
    const result = await api().query(me, {}).toPromise();
    expect(result.error).toBeUndefined();
    expect(result.data?.me.id).toBe('1');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('returns an authentication rejection without a misleading network error after refresh expires', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ data: { me: null } }))
      .mockResolvedValueOnce(json({ error: 'session_expired' }, 401))
      .mockResolvedValueOnce(json({ data: { me: null } }));
    const result = await api().query(me, {}).toPromise();
    expect(result.error?.networkError).toBeUndefined();
    expect(result.error?.graphQLErrors[0].extensions['reason']).toBe(
      'NOT_LOGGED_IN',
    );
    expect(store.get(loginDetailsAtom)).toBeUndefined();
    expect(store.get(sessionExpiredAtom)).toBe(true);
  });
  it('never replays partially successful mutations', async () => {
    fetchMock.mockResolvedValueOnce(
      json({
        data: { edited: { id: '1' }, failed: null },
        errors: [authError],
      }),
    );
    const result = await api()
      .mutation(
        gql`
          mutation Edit {
            edited {
              id
            }
            failed {
              id
            }
          }
        `,
        {},
      )
      .toPromise();
    expect(result.error).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('preserves stored credentials after a network failure and lets the next request retry', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    await expect(refreshAppSession(true)).rejects.toMatchObject({
      code: 'network_error',
    });
    expect(store.get(loginDetailsAtom)).toEqual(login);
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(
      json({ accessToken: fresh, refreshToken: 'rotated' }),
    );
    await expect(refreshAppSession(true)).resolves.toBe(fresh);
  });
  it('preserves the session when a proxy returns an HTML 401', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('<html>Proxy login required</html>', { status: 401 }),
    );
    await expect(refreshAppSession(true)).rejects.toMatchObject({
      code: 'invalid_response',
      status: 401,
    });
    expect(store.get(loginDetailsAtom)).toEqual(login);
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
  it('clears credentials only after a definitive session rejection', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'session_expired' }, 401));
    await expect(refreshAppSession(true)).rejects.toMatchObject({
      status: 401,
    });
    expect(store.get(loginDetailsAtom)).toBeUndefined();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('login');
  });
  it('ignores a refresh that finishes after logout', async () => {
    let finish: (value: Response) => void = () => {};
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    const refreshing = refreshAppSession(true);
    await clearLoginDetails();
    finish(json({ accessToken: fresh, refreshToken: 'rotated' }));
    await refreshing;
    expect(store.get(loginDetailsAtom)).toBeUndefined();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
  it('does not extend inactivity during background refresh', async () => {
    AppState.currentState = 'background';
    fetchMock.mockResolvedValueOnce(
      json({ accessToken: fresh, refreshToken: 'rotated' }),
    );
    await refreshAppSession(true);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      active: false,
    });
  });
  it('uses monotonic token age rather than the device wall clock', () => {
    jest.spyOn(Date, 'now').mockReturnValue(Number.MAX_SAFE_INTEGER);
    expect(appTokenNeedsRefresh()).toBe(false);
  });
});
