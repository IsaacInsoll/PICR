import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { adminAuthHeader, gqlRequest } from './graphqlClient';
import { authenticatorCode } from '../authenticator';
import { expectDashboardReady } from './dashboardReady';
import {
  expectNoBrowserFailures,
  trackBrowserFailures,
} from './browserFailures';

test('authenticator setup, manual key, recovery-code login and session restoration', async ({
  page,
  context,
}, testInfo) => {
  await page.clock.install();
  const headers = await adminAuthHeader();
  const username = `browser-mfa-${randomUUID()}`;
  const password = 'browser-security-password';
  const created = await gqlRequest<{ editAdminUser: { id: string } }>(
    'mutation($username: String!, $password: String!) { editAdminUser(name: "Browser MFA", username: $username, password: $password, folderId: "1", enabled: true) { id } }',
    { username, password },
    headers,
  );
  const id = created.data?.editAdminUser.id;
  expect(id).toBeTruthy();
  const failures = trackBrowserFailures(page);
  try {
    await page.goto('/');
    await page.getByLabel('Username').fill(username);
    await page
      .getByRole('textbox', { name: 'Password', exact: true })
      .fill(password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expectDashboardReady(page);
    await page.goto('/admin/settings/security');
    await page
      .getByRole('button', {
        name: 'Enable two-factor authentication',
        exact: true,
      })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Account security' });
    await dialog
      .getByRole('textbox', { name: 'Password', exact: true })
      .fill(password);
    await dialog
      .getByRole('button', { name: 'Connect authenticator', exact: true })
      .click();
    await expect(
      dialog.getByRole('img', { name: 'QR code for your PICR authenticator' }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'View setup key' }).click();
    const secret = await dialog.locator('pre').innerText();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    await expect(
      dialog.getByRole('button', { name: 'Copy setup key' }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath('authenticator-setup.png'),
    });
    await dialog
      .getByRole('textbox')
      .first()
      .fill(authenticatorCode(secret, -1));
    await dialog
      .getByRole('button', {
        name: 'Enable two-factor authentication',
        exact: true,
      })
      .click();
    await expect(
      dialog.getByText('Save your recovery codes', { exact: true }),
    ).toBeVisible();
    const recoveryCode = await dialog.locator('code').first().innerText();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
    await expect(
      dialog.getByRole('button', { name: 'Done', exact: true }),
    ).toBeDisabled();
    await dialog
      .getByRole('checkbox', {
        name: 'I have saved my recovery codes somewhere safe',
      })
      .check();
    await dialog.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.getByRole('button', { name: 'Replace recovery codes' }).click();
    const draftPassword = dialog.getByRole('textbox', {
      name: 'Password',
      exact: true,
    });
    await draftPassword.fill('unfinished form survives rotation');
    let refreshRequests = 0;
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/auth/refresh')
        refreshRequests += 1;
    });
    await page.clock.fastForward(16 * 60 * 1000);
    await expect
      .poll(() => refreshRequests, { timeout: 10_000 })
      .toBeGreaterThan(0);
    await expect(draftPassword).toHaveValue(
      'unfinished form survives rotation',
    );
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole('heading', {
        name: 'Two-factor authentication for your account',
      }),
    ).toBeVisible();
    const secondTab = await context.newPage();
    await secondTab.goto('/admin/settings/security');
    await expect(
      secondTab.getByRole('heading', {
        name: 'Two-factor authentication for your account',
      }),
    ).toBeVisible();
    await secondTab.close();
    // Server logout revokes the current refresh session, then an interactive login needs MFA.
    await page.evaluate(async () => {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-picr-auth': '1' },
        body: '{}',
      });
    });
    await page.reload();
    await page.getByLabel('Username').fill(username);
    await page
      .getByRole('textbox', { name: 'Password', exact: true })
      .fill(password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'One more step' }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: testInfo.outputPath('authenticator-login-mobile.png'),
    });
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
    await page
      .getByRole('button', { name: 'Use a recovery code instead' })
      .click();
    await page
      .getByRole('textbox', { name: 'Recovery code', exact: true })
      .fill(recoveryCode);
    await page.getByRole('button', { name: 'Verify and sign in' }).click();
    await expect(
      page.getByRole('heading', {
        name: 'Two-factor authentication for your account',
      }),
    ).toBeVisible();
    expectNoBrowserFailures(failures);
  } finally {
    if (id)
      await gqlRequest(
        'mutation($id: ID!) { deleteUser(id: $id) }',
        { id },
        headers,
      );
  }
});
