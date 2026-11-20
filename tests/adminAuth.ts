import type { AdminAuthResult } from '../shared/auth/adminAuth';
import type { ICredentials } from '../shared/types/credentials';

export function requestAdminLogin(
  server: string,
  credentials: ICredentials,
  headers: HeadersInit = {},
) {
  const requestHeaders = new Headers(headers);
  requestHeaders.set('content-type', 'application/json');
  requestHeaders.set('x-picr-auth', '1');
  requestHeaders.set('x-picr-client', 'native');
  return fetch(new URL('api/auth/login', server), {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(credentials),
  });
}

export async function getAdminAccessToken(
  server: string,
  credentials: ICredentials,
): Promise<string> {
  const response = await requestAdminLogin(server, credentials);
  if (!response.ok)
    throw new Error(`Administrator login failed with HTTP ${response.status}`);
  const result: AdminAuthResult = await response.json();
  if (result.status !== 'authenticated' || !result.accessToken.startsWith('ey'))
    throw new Error(
      'Administrator login did not return an authenticated session',
    );
  return result.accessToken;
}
