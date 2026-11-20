import { getDefaultStore } from 'jotai';
import { AppState } from 'react-native';
import { z } from 'zod';
import {
  clearLoginDetails,
  getLoginDetailsFromLocalDevice,
  loginDetailsAtom,
  saveLoginDetails,
  sessionExpiredAtom,
} from '../hooks/useLoginDetails';
import {
  isRejectedNativeSession,
  nativeAuthRequest,
} from './nativeAuthRequest';

const store = getDefaultStore();
let restore: Promise<void> | undefined;
let refresh: Promise<string> | undefined;
let timing: { token: string; refreshAt: number } | undefined;
export function appSessionIdentity(token: string): string {
  try {
    const claims: unknown = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    if (
      claims &&
      typeof claims === 'object' &&
      'sessionId' in claims &&
      typeof claims.sessionId === 'string'
    )
      return claims.sessionId;
  } catch {
    /* An invalid token will be rejected by refresh. */
  }
  return token;
}
export function recordAppToken(token: string) {
  let lifetime = 0;
  try {
    const claims: unknown = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    if (
      claims &&
      typeof claims === 'object' &&
      'exp' in claims &&
      typeof claims.exp === 'number' &&
      'iat' in claims &&
      typeof claims.iat === 'number'
    )
      lifetime = (claims.exp - claims.iat) * 1000;
  } catch {
    /* Force refresh of malformed/unknown credentials. */
  }
  timing = {
    token,
    refreshAt: performance.now() + Math.max(0, lifetime - 30_000),
  };
}
export const appTokenNeedsRefresh = () => {
  const token = store.get(loginDetailsAtom)?.token;
  return (
    !timing || timing.token !== token || performance.now() >= timing.refreshAt
  );
};
export async function expireAppSession(identity: string) {
  const login = store.get(loginDetailsAtom);
  if (!login || appSessionIdentity(login.token) !== identity) return;
  store.set(sessionExpiredAtom, true);
  await clearLoginDetails();
}
export function restoreAppSession() {
  restore ??= getLoginDetailsFromLocalDevice()
    .then((login) => {
      if (!store.get(loginDetailsAtom) && login)
        store.set(loginDetailsAtom, login);
    })
    .catch((error: unknown) => {
      restore = undefined;
      throw error;
    });
  return restore;
}
export async function refreshAppSession(force = false): Promise<string> {
  const login = store.get(loginDetailsAtom);
  if (!login) return '';
  if (!force && !appTokenNeedsRefresh()) return login.token;
  if (refresh) return refresh;
  refresh = (async () => {
    try {
      const result = z
        .object({
          accessToken: z.string().min(1),
          refreshToken: z.string().min(1),
        })
        .parse(
          await nativeAuthRequest(login.server, 'refresh', {
            refreshToken: login.refreshToken,
            active: AppState.currentState === 'active',
          }),
        );
      if (store.get(loginDetailsAtom) !== login) return '';
      await saveLoginDetails(
        {
          ...login,
          token: result.accessToken,
          refreshToken: result.refreshToken,
        },
        login,
      );
      if (store.get(loginDetailsAtom)?.token !== result.accessToken) return '';
      recordAppToken(result.accessToken);
      return result.accessToken;
    } catch (error) {
      if (
        isRejectedNativeSession(error) &&
        store.get(loginDetailsAtom) === login
      ) {
        await expireAppSession(appSessionIdentity(login.token));
      }
      throw error;
    }
  })().finally(() => {
    refresh = undefined;
  });
  return refresh;
}
