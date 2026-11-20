/** Exact callbacks only: never accept a caller-controlled redirect destination. */
export const nativeRedirectUris = [
  'picr://auth/callback',
  'picrdev://auth/callback',
] as const;

export interface NativeAuthorizationRequest {
  redirectUri: (typeof nativeRedirectUris)[number];
  codeChallenge: string;
  state: string;
}

export interface NativeSession {
  accessToken: string;
  refreshToken: string;
}

export interface NativeAccount {
  name: string;
  username: string | null;
  gravatar: string | null;
}

export function parseNativeAuthorization(
  params: URLSearchParams,
): NativeAuthorizationRequest | null {
  const redirectUri = nativeRedirectUris.find(
    (uri) => uri === params.get('redirect_uri'),
  );
  const codeChallenge = params.get('code_challenge') ?? '';
  const state = params.get('state') ?? '';
  if (
    !redirectUri ||
    params.get('code_challenge_method') !== 'S256' ||
    !/^[A-Za-z0-9_-]{43}$/.test(codeChallenge) ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(state) ||
    [...params.keys()].some((key) => params.getAll(key).length !== 1)
  )
    return null;
  return { redirectUri, codeChallenge, state };
}
