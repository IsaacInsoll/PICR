import { createHash, randomBytes } from 'node:crypto';
import { expect, test } from 'vitest';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { testUrl } from './testVariables';

async function post(
  path: string,
  body: object = {},
  headers: Record<string, string> = {},
) {
  return fetch(`${testUrl}api/auth/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-picr-auth': '1',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
const native = { 'x-picr-client': 'native' };
const redirectUri = 'picrdev://auth/callback';

test('native PKCE handoff is single-use, bound to the callback, and creates an independent renewable session', async () => {
  const login = await post('login', defaultCredentials);
  expect(login.status).toBe(200);
  const browser: { accessToken: string } = await login.json();
  const cookie = login.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('Expected browser refresh cookie');
  const authorization = `Bearer ${browser.accessToken}`;
  const verifier = randomBytes(32).toString('base64url');
  const request = {
    redirectUri,
    codeChallenge: createHash('sha256').update(verifier).digest('base64url'),
    state: randomBytes(32).toString('base64url'),
  };
  const exchange = (code: string, extra: object = {}, headers = native) =>
    post(
      'native/token',
      { code, codeVerifier: verifier, redirectUri, ...extra },
      headers,
    );
  const approve = async () => {
    const result = await post('native/authorize', request, { authorization });
    expect(result.status).toBe(200);
    return ((await result.json()) as { code: string }).code;
  };
  expect((await post('native/config', {}, native)).status).toBe(200);
  expect((await post('native/authorize', request)).status).toBe(401);
  expect(
    (
      await post(
        'native/authorize',
        { ...request, redirectUri: 'https://attacker.example/' },
        { authorization },
      )
    ).status,
  ).toBe(400);
  const code = await approve();
  expect(
    (await exchange(code, { codeVerifier: 'wrong'.repeat(12) })).status,
  ).toBe(400);
  expect(
    (await exchange(code, { redirectUri: 'picr://auth/callback' })).status,
  ).toBe(400);
  expect((await exchange(code, {}, {})).status).toBe(400);
  const concurrent = await Promise.all([exchange(code), exchange(code)]);
  expect(concurrent.map((response) => response.status).sort()).toEqual([
    200, 401,
  ]);
  const accepted = concurrent.find((response) => response.status === 200);
  if (!accepted) throw new Error('Expected exactly one native session');
  expect(accepted.headers.get('set-cookie')).toBeNull();
  expect(accepted.headers.get('cache-control')).toBe('no-store');
  const app: { accessToken: string; refreshToken: string } =
    await accepted.json();
  const browserClaims = JSON.parse(
    Buffer.from(browser.accessToken.split('.')[1], 'base64url').toString(),
  );
  const appClaims = JSON.parse(
    Buffer.from(app.accessToken.split('.')[1], 'base64url').toString(),
  );
  expect(appClaims.sessionId).not.toBe(browserClaims.sessionId);
  expect(appClaims.exp - appClaims.iat).toBe(900);
  const refreshed = await post(
    'refresh',
    { refreshToken: app.refreshToken },
    native,
  );
  expect(refreshed.status).toBe(200);
  expect(refreshed.headers.get('set-cookie')).toBeNull();
  const rotated: { accessToken: string; refreshToken: string } =
    await refreshed.json();
  expect(rotated.refreshToken).not.toBe(app.refreshToken);
  const nativeLogout = await post(
    'logout',
    { refreshToken: rotated.refreshToken },
    native,
  );
  expect(nativeLogout.status).toBe(200);
  expect(nativeLogout.headers.get('set-cookie')).toBeNull();
  expect(
    (
      await post(
        'native/account',
        {},
        { authorization: `Bearer ${rotated.accessToken}` },
      )
    ).status,
  ).toBe(401);
  expect((await post('native/account', {}, { authorization })).status).toBe(
    200,
  );
  // Already-connected apps survive browser logout; unexchanged codes do not.
  const second: { refreshToken: string } = await (
    await exchange(await approve())
  ).json();
  const pending = await approve();
  expect((await post('logout', {}, { cookie })).status).toBe(200);
  expect((await exchange(pending)).status).toBe(401);
  const secondRefresh = await post(
    'refresh',
    { refreshToken: second.refreshToken },
    native,
  );
  expect(secondRefresh.status).toBe(200);
  const last: { refreshToken: string } = await secondRefresh.json();
  expect(
    (await post('logout', { refreshToken: last.refreshToken }, native)).status,
  ).toBe(200);
});
