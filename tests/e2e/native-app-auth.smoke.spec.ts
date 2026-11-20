import { createHash, randomBytes } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import type { NativeAccount } from '../../shared/auth/nativeAuth';

const headers = { 'x-picr-auth': '1' };
const authorizationRequest = () => {
  const verifier = randomBytes(32).toString('base64url');
  const state = randomBytes(32).toString('base64url');
  const params = new URLSearchParams({
    redirect_uri: 'picr://auth/callback',
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
    state,
  });
  return { path: `/app-sign-in?${params}`, verifier, state };
};
async function browserLogin(page: Page) {
  const response = await page.request.post('/api/auth/login', {
    headers,
    data: defaultCredentials,
  });
  expect(response.status()).toBe(200);
  const session: { status: string; accessToken: string } =
    await response.json();
  expect(session.status).toBe('authenticated');
  return session;
}
async function fillLogin(page: Page) {
  await page
    .getByRole('textbox', { name: 'Username', exact: true })
    .fill(defaultCredentials.username);
  await page
    .getByRole('textbox', { name: 'Password', exact: true })
    .fill(defaultCredentials.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
}
function countAuthorizations(page: Page) {
  let requests = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/native/authorize')
      requests += 1;
  });
  return () => requests;
}
async function finishHandoff(
  page: Page,
  request: ReturnType<typeof authorizationRequest>,
) {
  const returnLink = page.getByRole('link', { name: 'Return to PICR' });
  await expect(returnLink).toBeVisible();
  const callback = new URL((await returnLink.getAttribute('href')) ?? '');
  expect(callback.protocol).toBe('picr:');
  expect(callback.searchParams.get('state')).toBe(request.state);
  expect([...callback.searchParams.keys()].sort()).toEqual(['code', 'state']);
  const token = await page.request.post('/api/auth/native/token', {
    headers: { ...headers, 'x-picr-client': 'native' },
    data: {
      code: callback.searchParams.get('code'),
      codeVerifier: request.verifier,
      redirectUri: 'picr://auth/callback',
    },
  });
  expect(token.status()).toBe(200);
  const session: { refreshToken: string } = await token.json();
  expect(session.refreshToken).toBeTruthy();
  await page.request.post('/api/auth/logout', {
    headers: { ...headers, 'x-picr-client': 'native' },
    data: { refreshToken: session.refreshToken },
  });
}

test('fresh browser sign-in returns to the app without another confirmation', async ({
  page,
}) => {
  const request = authorizationRequest();
  const requests = countAuthorizations(page);
  await page.goto(request.path);
  await fillLogin(page);
  await finishHandoff(page, request);
  await expect(page.getByRole('button', { name: /^Continue as / })).toHaveCount(
    0,
  );
  expect(requests()).toBe(1);
});

test('a reused browser session shows the account avatar and server address', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const session = await browserLogin(page);
  const accountResponse = await page.request.post('/api/auth/native/account', {
    headers: { ...headers, authorization: `Bearer ${session.accessToken}` },
    data: {},
  });
  const account: NativeAccount = await accountResponse.json();
  expect(Object.keys(account).sort()).toEqual(['gravatar', 'name', 'username']);
  const request = authorizationRequest();
  const requests = countAuthorizations(page);
  await page.goto(request.path);
  const displayName = account.name.trim() || account.username;
  const continueButton = page.getByRole('button', {
    name: `Continue as ${displayName}`,
    exact: true,
  });
  await expect(continueButton).toBeEnabled();
  await expect(
    page.locator('#root').getByText(displayName ?? '', { exact: true }),
  ).toBeVisible();
  expect(requests()).toBe(0);
  const server = page.getByText(`${new URL(page.url()).origin}/`, {
    exact: true,
  });
  await expect(server).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('native-account-phone.png'),
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 320, height: 568 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await continueButton.click();
  await finishHandoff(page, request);
  expect(requests()).toBe(1);
  expect(errors).toEqual([]);
});

test('switching a reused account requires login and then returns directly to the app', async ({
  page,
}) => {
  await browserLogin(page);
  const request = authorizationRequest();
  const requests = countAuthorizations(page);
  await page.goto(request.path);
  await page.getByRole('button', { name: 'Use a different account' }).click();
  expect(requests()).toBe(0);
  await fillLogin(page);
  await finishHandoff(page, request);
  expect(requests()).toBe(1);
});

// These two cases isolate completion timing in the UI. The native code exchange
// still uses a real server session; API tests separately cover actual MFA policy.
test('a fresh two-factor login connects only after verification succeeds', async ({
  page,
  context,
}) => {
  const session = await browserLogin(page);
  await context.clearCookies();
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      json: { status: 'second_factor_required', challenge: 'test-challenge' },
    }),
  );
  await page.route('**/api/auth/verify', (route) =>
    route.fulfill({ json: session }),
  );
  const request = authorizationRequest();
  const requests = countAuthorizations(page);
  await page.goto(request.path);
  await fillLogin(page);
  await expect(page.getByText('One more step', { exact: true })).toBeVisible();
  expect(requests()).toBe(0);
  await page
    .locator('input[autocomplete="one-time-code"]')
    .first()
    .pressSequentially('123456');
  await page.getByRole('button', { name: 'Verify and sign in' }).click();
  await finishHandoff(page, request);
  expect(requests()).toBe(1);
});

test('required enrollment waits for recovery codes to be saved before returning to the app', async ({
  page,
  context,
}) => {
  const session = await browserLogin(page);
  await context.clearCookies();
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      json: { status: 'enrollment_required', challenge: 'test-enrollment' },
    }),
  );
  await page.route('**/api/auth/setup', (route) =>
    route.fulfill({
      json: { secret: 'JBSWY3DPEHPK3PXP', qrCode: 'logo192.png' },
    }),
  );
  await page.route('**/api/auth/confirm', (route) =>
    route.fulfill({
      json: { ...session, recoveryCodes: ['test-recovery-code'] },
    }),
  );
  const request = authorizationRequest();
  const requests = countAuthorizations(page);
  await page.goto(request.path);
  await fillLogin(page);
  await page.getByRole('button', { name: 'Connect authenticator' }).click();
  await page
    .locator('input[autocomplete="one-time-code"]')
    .first()
    .pressSequentially('123456');
  await page
    .getByRole('button', { name: 'Enable two-factor authentication' })
    .click();
  await expect(
    page.getByText('test-recovery-code', { exact: true }),
  ).toBeVisible();
  expect(requests()).toBe(0);
  const done = page.getByRole('button', { name: 'Done', exact: true });
  await expect(done).toBeDisabled();
  await page
    .getByLabel('I have saved my recovery codes somewhere safe')
    .check();
  await done.click();
  await finishHandoff(page, request);
  expect(requests()).toBe(1);
});

test('invalid app authorization links cannot solicit credentials or redirect', async ({
  page,
}) => {
  await page.goto('/app-sign-in?redirect_uri=https://attacker.example/');
  await expect(page.getByRole('alert')).toContainText(
    'This sign-in link is invalid or incomplete',
  );
  await expect(page.getByLabel('Username')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Continue as / })).toHaveCount(
    0,
  );
});
