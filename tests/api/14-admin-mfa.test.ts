import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { authenticatorCode as totp } from '../authenticator';
import { expect, test } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getUserHeader, createTestGraphqlClient } from './testGraphqlClient';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { editAdminUserMutation } from '../../shared/urql/mutations/editAdminUserMutation';
import { deleteUserMutation } from '../../shared/urql/mutations/deleteUserMutation';
import { loginMutation } from '../../shared/urql/mutations/loginMutation';
import { meQuery } from '../../shared/urql/queries/meQuery';
import { testUrl } from './testVariables';
import type {
  AdminAuthResult,
  AuthenticatorSetup,
} from '../../shared/auth/adminAuth';

async function post(
  path: string,
  body: object = {},
  authorization?: string,
  cookie?: string,
) {
  return fetch(`${testUrl}api/auth/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-picr-auth': '1',
      ...(authorization ? { authorization } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}
const cookieFrom = (response: Response) =>
  response.headers.get('set-cookie')?.split(';')[0];

test('admin TOTP enrollment, recovery, enforcement and rotating sessions', async () => {
  const ownerHeaders = await getUserHeader(defaultCredentials);
  const owner = await createTestGraphqlClient(ownerHeaders);
  const username = `mfa-${randomUUID()}`;
  const password = 'A-password-for-mfa-tests';
  const created = await owner
    .mutation(editAdminUserMutation, {
      name: 'MFA test admin',
      username,
      password,
      folderId: '1',
      enabled: true,
    })
    .toPromise();
  const id = created.data?.editAdminUser.id;
  expect(id).toBeTruthy();
  let accessToken = '';
  let codes: string[] = [];
  let policyOn = false;
  try {
    const login = await post('login', { username, password });
    expect(login.status).toBe(200);
    const initial: AdminAuthResult = await login.json();
    expect(initial.status).toBe('authenticated');
    if (initial.status !== 'authenticated') throw new Error('Expected login');
    accessToken = initial.accessToken;
    const claims = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'),
    );
    expect(claims.exp - claims.iat).toBe(900);
    expect(claims.hashedPassword).toBeUndefined();
    const legacyBefore = await createTestGraphqlClient({});
    const legacyToken = (
      await legacyBefore
        .mutation(loginMutation, { username, password })
        .toPromise()
    ).data?.auth;
    expect(legacyToken).toBeTruthy();
    const oldCookie = cookieFrom(login);
    expect(login.headers.get('set-cookie')).toContain('HttpOnly');
    expect(login.headers.get('cache-control')).toBe('no-store');
    const setupResponse = await post(
      'setup',
      { password },
      `Bearer ${accessToken}`,
    );
    expect(setupResponse.status).toBe(200);
    const setup: AuthenticatorSetup = await setupResponse.json();
    expect(setup.qrCode).toMatch(/^data:image\/png;base64,/);
    const setupCode = totp(setup.secret, -1);
    const confirmation = await post(
      'confirm',
      { code: setupCode },
      `Bearer ${accessToken}`,
    );
    expect(confirmation.status).toBe(200);
    const confirmed: { accessToken: string; recoveryCodes: string[] } =
      await confirmation.json();
    codes = confirmed.recoveryCodes;
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    const staleClient = await createTestGraphqlClient({
      authorization: `Bearer ${accessToken}`,
    });
    expect(
      (await staleClient.query(meQuery, {}).toPromise()).data?.me,
    ).toBeNull();
    const staleLegacy = await createTestGraphqlClient({
      authorization: `Bearer ${legacyToken}`,
    });
    expect(
      (await staleLegacy.query(meQuery, {}).toPromise()).data?.me,
    ).toBeNull();
    accessToken = confirmed.accessToken;
    const legacy = await createTestGraphqlClient({});
    expect(
      (await legacy.mutation(loginMutation, { username, password }).toPromise())
        .data?.auth,
    ).toBe('');
    const next: AdminAuthResult = await (
      await post('login', { username, password })
    ).json();
    if (next.status !== 'second_factor_required')
      throw new Error('Expected MFA challenge');
    expect(
      (await post('verify', { challenge: next.challenge, code: setupCode }))
        .status,
    ).toBe(401);
    const verification = await post('verify', {
      challenge: next.challenge,
      code: totp(setup.secret),
    });
    expect(verification.status).toBe(200);
    const signedIn: { accessToken: string } = await verification.json();
    accessToken = signedIn.accessToken;
    expect(
      (await post('verify', { challenge: next.challenge, code: codes[0] }))
        .status,
    ).toBe(401);
    const refreshCookie = cookieFrom(verification);
    const refresh = await post('refresh', {}, undefined, refreshCookie);
    expect(refresh.status).toBe(200);
    const refreshResult: { accessToken: string; refreshToken?: string } =
      await refresh.json();
    expect(refreshResult.refreshToken).toBeUndefined();
    const rotatedCookie = cookieFrom(refresh);
    expect(rotatedCookie).not.toBe(refreshCookie);
    expect((await post('refresh', {}, undefined, refreshCookie)).status).toBe(
      409,
    );
    const logout = await post('logout', {}, undefined, rotatedCookie);
    expect(logout.status).toBe(200);
    const revoked = await createTestGraphqlClient({
      authorization: `Bearer ${refreshResult.accessToken}`,
    });
    expect((await revoked.query(meQuery, {}).toPromise()).data?.me).toBeNull();
    expect((await post('refresh', {}, undefined, oldCookie)).status).toBe(401);
    // Enable enforcement using a separate live session and a recovery code.
    const policy = await post(
      'change',
      { action: 'policy', required: true, password, code: codes[0] },
      `Bearer ${confirmed.accessToken}`,
    );
    expect(policy.status).toBe(200);
    policyOn = true;
    accessToken = confirmed.accessToken;
    expect((await post('login', defaultCredentials)).status).toBe(200);
    const enforced: AdminAuthResult = await (
      await post('login', defaultCredentials)
    ).json();
    expect(enforced.status).toBe('enrollment_required');
    if (enforced.status === 'enrollment_required') {
      const restricted = await createTestGraphqlClient({
        authorization: `Bearer ${enforced.challenge}`,
      });
      expect(
        (await restricted.query(meQuery, {}).toPromise()).data?.me,
      ).toBeNull();
    }
    expect(
      (
        await post(
          'change',
          { action: 'disable', password, code: codes[1] },
          `Bearer ${accessToken}`,
        )
      ).status,
    ).toBe(403);
    const optional = await post(
      'change',
      { action: 'policy', required: false, password, code: codes[1] },
      `Bearer ${accessToken}`,
    );
    expect(optional.status).toBe(200);
    policyOn = false;
    const regenerate = await post(
      'change',
      { action: 'recovery', password, code: codes[2] },
      `Bearer ${accessToken}`,
    );
    expect(regenerate.status).toBe(200);
    const regenerated: { accessToken: string; recoveryCodes: string[] } =
      await regenerate.json();
    accessToken = regenerated.accessToken;
    const challenge: AdminAuthResult = await (
      await post('login', { username, password })
    ).json();
    if (challenge.status !== 'second_factor_required')
      throw new Error('Expected challenge');
    expect(
      (await post('verify', { challenge: challenge.challenge, code: codes[3] }))
        .status,
    ).toBe(401);
    const concurrent = await Promise.all([
      post('verify', {
        challenge: challenge.challenge,
        code: `  ${regenerated.recoveryCodes[0].replaceAll('-', ' ')}  `,
      }),
      post('verify', {
        challenge: challenge.challenge,
        code: `  ${regenerated.recoveryCodes[0].replaceAll('-', ' ')}  `,
      }),
    ]);
    expect(concurrent.map((result) => result.status).sort()).toEqual([
      200, 401,
    ]);
    const enforceForRecovery = await post(
      'change',
      {
        action: 'policy',
        required: true,
        password,
        code: regenerated.recoveryCodes[1],
      },
      `Bearer ${accessToken}`,
    );
    expect(enforceForRecovery.status).toBe(200);
    policyOn = true;
    await promisify(execFile)('docker', [
      'exec',
      'test-picr',
      'node',
      'server/backend/scripts/resetAdminMfa.js',
      '--username',
      username,
      '--confirm',
      username,
      '--disable-policy',
    ]);
    policyOn = false;
    const recovered: AdminAuthResult = await (
      await post('login', { username, password })
    ).json();
    expect(recovered.status).toBe('authenticated');
  } finally {
    if (policyOn)
      await post(
        'change',
        { action: 'policy', required: false, password, code: codes[9] },
        `Bearer ${accessToken}`,
      );
    const cleanupHeaders = await getUserHeader(defaultCredentials);
    const cleanup = await createTestGraphqlClient(cleanupHeaders);
    if (id) await cleanup.mutation(deleteUserMutation, { id }).toPromise();
  }
});

test('admin authentication rejects cross-origin and simple form requests', async () => {
  const crossOrigin = await fetch(`${testUrl}api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-picr-auth': '1',
      origin: 'https://attacker.invalid',
    },
    body: JSON.stringify(defaultCredentials),
  });
  expect(crossOrigin.status).toBe(403);
  const simple = await fetch(`${testUrl}api/auth/login`, {
    method: 'POST',
    body: new URLSearchParams(defaultCredentials),
  });
  expect(simple.status).toBe(403);
});

test('alternate same-origin addresses and proxy-derived HTTPS can sign in', async () => {
  const alternate = await fetch('http://127.0.0.1:6901/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-picr-auth': '1',
      origin: 'http://127.0.0.1:6901',
    },
    body: JSON.stringify(defaultCredentials),
  });
  expect(alternate.status).toBe(200);
  expect(alternate.headers.get('set-cookie')).not.toContain('; Secure');
  const forwardedHttps = await fetch(`${testUrl}api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-picr-auth': '1',
      origin: 'https://localhost:6901',
      'x-forwarded-proto': 'https',
    },
    body: JSON.stringify(defaultCredentials),
  });
  expect(forwardedHttps.status).toBe(200);
  expect(forwardedHttps.headers.get('set-cookie')).toContain('; Secure');
});

test('concurrent logins do not exhaust the connection pool while holding user locks', async () => {
  const responses = await Promise.all(
    Array.from({ length: 20 }, () => post('login', defaultCredentials)),
  );
  expect(responses.map((response) => response.status)).toEqual(
    Array(20).fill(200),
  );
});

test('REST and legacy GraphQL share the proxy-aware login rate-limit identity', async () => {
  const owner = await createTestGraphqlClient(
    await getUserHeader(defaultCredentials),
  );
  const username = `rate-identity-${randomUUID()}`;
  const password = 'rate-identity-password';
  const created = await owner
    .mutation(editAdminUserMutation, {
      name: 'Rate identity',
      username,
      password,
      folderId: '3',
      enabled: true,
    })
    .toPromise();
  const id = created.data?.editAdminUser.id;
  expect(id).toBeTruthy();
  try {
    for (let i = 0; i < 5; i++)
      await post('login', { username, password: 'incorrect' });
    const spoofed = await createTestGraphqlClient({
      'x-real-ip': '198.51.100.123',
    });
    const login = await spoofed
      .mutation(loginMutation, { username, password })
      .toPromise();
    expect(login.data?.auth).toBe('');
    expect((await post('login', { username, password })).status).toBe(429);
  } finally {
    if (id) await owner.mutation(deleteUserMutation, { id }).toPromise();
  }
});
