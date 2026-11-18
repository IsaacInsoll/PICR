import { getDefaultStore } from 'jotai';
import { adminAuthErrorCodes } from '@shared/auth/adminAuth';
import { authKeyAtom } from '../atoms/authAtom';
import { withBasePath } from './baseHref';
import { getUUID } from './getUUID';
import type {
  AdminAuthErrorCode,
  AdminAuthResult,
} from '@shared/auth/adminAuth';

export class AuthRequestError extends Error {
  constructor(
    public code: AdminAuthErrorCode | 'network_error',
    public status = 0,
  ) {
    super(code);
  }
}
const store = getDefaultStore();
let refreshPromise: Promise<string> | undefined;
let lastActivity = Date.now();
export const markAdminActivity = () => {
  lastActivity = Date.now();
};

let tokenTiming:
  { token: string; refreshAt: number; principal: string } | undefined;

export function setAdminAccessToken(token: string): void {
  let lifetimeMs = 0;
  let principal = '';
  try {
    const claims: unknown = JSON.parse(
      atob(token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')),
    );
    if (
      claims &&
      typeof claims === 'object' &&
      'userId' in claims &&
      typeof claims.userId === 'number' &&
      Number.isInteger(claims.userId)
    )
      principal = String(claims.userId);
    if (
      claims &&
      typeof claims === 'object' &&
      'exp' in claims &&
      'iat' in claims &&
      typeof claims.exp === 'number' &&
      typeof claims.iat === 'number'
    )
      lifetimeMs = Math.max(0, (claims.exp - claims.iat) * 1000);
  } catch {
    /* A malformed token will require a refresh before use. */
  }
  tokenTiming = {
    token,
    principal,
    refreshAt: performance.now() + Math.max(0, lifetimeMs - 30_000),
  };
  store.set(authKeyAtom, token);
}

export function adminAccessTokenNeedsRefresh(): boolean {
  return (
    tokenTiming?.token !== store.get(authKeyAtom) ||
    performance.now() >= tokenTiming.refreshAt
  );
}

export async function authRequest<T>(
  path: string,
  body: object = {},
  authorization?: string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(withBasePath(`api/auth/${path}`), {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'content-type': 'application/json',
        'x-picr-auth': '1',
        ...(authorization ? { authorization } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthRequestError('network_error');
  }
  if (!response.ok) {
    const data: unknown = await authResponseJson(response);
    const code =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'server_error';
    throw new AuthRequestError(
      adminAuthErrorCodes.find((value) => value === code) ?? 'server_error',
      response.status,
    );
  }
  return authResponseJson<T>(response);
}

async function authResponseJson<T>(response: Response): Promise<T> {
  try {
    return await response.json();
  } catch {
    throw new AuthRequestError('server_error', response.status);
  }
}

// Only the account identity keys the GraphQL cache; token rotation preserves it.
export function adminSessionPrincipal(token: string): string {
  return tokenTiming?.token === token ? tokenTiming.principal : '';
}

export const acceptAdminSession = (result: AdminAuthResult) => {
  if (result.status === 'authenticated')
    setAdminAccessToken(result.accessToken);
};

export async function refreshSession(force = false): Promise<string> {
  if (getUUID()) return '';
  const token = store.get(authKeyAtom);
  if (!force && !adminAccessTokenNeedsRefresh()) return token;
  if (refreshPromise) return refreshPromise;
  const refresh = async () => {
    // Cross-tab Web Locks serializes cookie rotation. Each tab obtains its own fresh access token.
    try {
      const request = () =>
        authRequest<{ accessToken?: string }>('refresh', {
          active:
            document.visibilityState === 'visible' &&
            Date.now() - lastActivity < 15 * 60 * 1000,
        });
      let result: { accessToken?: string };
      try {
        result = await request();
      } catch (error) {
        if (!(error instanceof AuthRequestError) || error.status !== 409)
          throw error;
        await new Promise((resolve) => setTimeout(resolve, 500));
        result = await request();
      }
      if (!result.accessToken)
        throw new AuthRequestError('session_expired', 401);
      setAdminAccessToken(result.accessToken);
      return result.accessToken;
    } catch (error) {
      if (error instanceof AuthRequestError && error.status === 401)
        store.set(authKeyAtom, '');
      throw error;
    }
  };
  const browserNavigator: Partial<Navigator> = navigator;
  refreshPromise = (
    browserNavigator.locks
      ? browserNavigator.locks.request(`picr-auth:${withBasePath('')}`, refresh)
      : refresh()
  ).finally(() => {
    refreshPromise = undefined;
  });
  return refreshPromise;
}

export async function restoreAdminSession(): Promise<void> {
  if (getUUID()) return;
  // Access tokens now live in memory; old password-only sessions require a fresh login.
  try {
    localStorage.removeItem('authKey');
  } catch {
    /* Storage can be disabled; sessions no longer depend on it. */
  }
  try {
    await refreshSession(true);
  } catch (error) {
    if (!(error instanceof AuthRequestError)) throw error;
  }
}

export async function authenticatedRequest<T>(
  path: string,
  body: object = {},
): Promise<T> {
  const token = await refreshSession();
  return authRequest<T>(path, body, `Bearer ${token}`);
}

export async function logoutAdmin(): Promise<void> {
  await authRequest('logout');
  store.set(authKeyAtom, '');
}
