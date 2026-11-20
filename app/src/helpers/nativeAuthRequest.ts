import { createServerOrigin } from './authenticatedServerOrigin';
import {
  adminAuthErrorCodes,
  type AdminAuthErrorCode,
} from '@shared/auth/adminAuth';

type NativeAuthErrorCode =
  | AdminAuthErrorCode
  | 'invalid_server'
  | 'server_upgrade_required'
  | 'invalid_response'
  | 'network_error'
  | 'invalid_callback';

export class NativeAuthError extends Error {
  constructor(
    public code: NativeAuthErrorCode,
    public status = 0,
  ) {
    super(code);
  }
}
export async function nativeAuthRequest(
  server: string,
  path: string,
  body: object = {},
): Promise<unknown> {
  const origin = createServerOrigin(server);
  if (!origin) throw new NativeAuthError('invalid_server');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(origin.urlForPath(`api/auth/${path}`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-picr-auth': '1',
        'x-picr-client': 'native',
      },
      credentials: 'omit',
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (response.status === 404)
      throw new NativeAuthError('server_upgrade_required', 404);
    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new NativeAuthError('invalid_response', response.status);
    }
    if (!response.ok) {
      const code =
        result &&
        typeof result === 'object' &&
        'error' in result &&
        typeof result.error === 'string'
          ? result.error
          : 'server_error';
      throw new NativeAuthError(
        adminAuthErrorCodes.find((value) => value === code) ?? 'server_error',
        response.status,
      );
    }
    return result;
  } catch (error) {
    if (error instanceof NativeAuthError) throw error;
    throw new NativeAuthError('network_error');
  } finally {
    clearTimeout(timer);
  }
}
export const isRejectedNativeSession = (
  error: unknown,
): error is NativeAuthError =>
  error instanceof NativeAuthError &&
  error.status === 401 &&
  error.code === 'session_expired';

export function nativeAuthErrorMessage(error: unknown): string {
  if (!(error instanceof NativeAuthError))
    return 'Unable to finish signing in. Please try again.';
  switch (error.code) {
    case 'server_upgrade_required':
    case 'invalid_response':
      return 'This server could not start app sign-in. Update PICR on your server and check that the URL opens your PICR website.';
    case 'network_error':
      return 'Unable to reach your server. Check the server address and your connection, then try again.';
    case 'invalid_server':
      return 'Enter the address of your PICR server.';
    case 'session_expired':
      return 'Your sign-in has expired. Please sign in again.';
    case 'invalid_callback':
      return 'The sign-in response could not be verified. Please try again.';
    case 'rate_limited':
      return 'Too many sign-in attempts. Please wait a few minutes and try again.';
    case 'refresh_in_progress':
    case 'invalid_credentials':
    case 'invalid_code':
    case 'challenge_expired':
    case 'mfa_unavailable':
    case 'enrollment_required':
    case 'invalid_request':
    case 'server_error':
      return 'The server could not finish signing in. Please try again.';
  }
}
