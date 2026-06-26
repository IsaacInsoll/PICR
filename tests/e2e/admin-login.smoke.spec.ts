import { expect, test } from '@playwright/test';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { photoFolderId } from '../api/testVariables';
import {
  expectNoBrowserFailures,
  trackBrowserFailures,
} from './browserFailures';

// Smoke test for the authenticated admin UI — the most Mantine/react-router
// dense surface. Drives the real login form, then loads the dashboard and a
// folder view, asserting they render with no browser/runtime errors. This is
// the main guard for high-blast-radius UI/router dependency upgrades.
test('admin login renders the dashboard and a folder view with no browser/runtime errors', async ({
  page,
}) => {
  const failures = trackBrowserFailures(page);

  // Login page renders (Mantine form).
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Login to PICR')).toBeVisible();
  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();

  // Drive the real login form.
  await page.getByLabel('Username').fill(defaultCredentials.username);
  await page.getByLabel('Password').fill(defaultCredentials.password);
  await page.getByRole('button', { name: 'Login' }).click();

  // Logged-in routes take over → redirected to the dashboard (react-router).
  await page.waitForURL('**/admin', { timeout: 15_000 });
  await expect(page.getByText('PICR Media Delivery')).toBeVisible();
  await expect(page.getByText('Login to PICR')).toHaveCount(0);
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  expectNoBrowserFailures(failures);

  // Authenticated folder view (gallery / app shell) renders.
  await page.goto(`/admin/f/${photoFolderId}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(new RegExp(`/admin/f/${photoFolderId}`));
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  await expect(page.getByText('Login to PICR')).toHaveCount(0);
  expectNoBrowserFailures(failures);
});
