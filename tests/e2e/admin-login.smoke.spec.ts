import { expect, test } from '@playwright/test';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { photoFolderId } from '../api/testVariables';
import {
  expectNoBrowserFailures,
  trackBrowserFailures,
} from './browserFailures';
import { expectDashboardReady } from './dashboardReady';

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
  await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();

  // Drive the real login form.
  await page.getByLabel('Username').fill(defaultCredentials.username);
  await page
    .getByRole('textbox', { name: 'Password' })
    .fill(defaultCredentials.password);
  await page.getByRole('button', { name: 'Login' }).click();

  // Logged-in routes take over → redirected to the dashboard (react-router).
  await page.waitForURL('**/admin', { timeout: 15_000 });
  await expectDashboardReady(page);
  await expect(page.getByText('Login to PICR')).toHaveCount(0);
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  expectNoBrowserFailures(failures);

  // Follow the real client-side folder link. A second page.goto() would unload
  // the dashboard and cancel any lazy bundle preloads still in flight, which
  // Chromium correctly reports as net::ERR_ABORTED request failures.
  const photoFolderLink = page
    .locator(`a[href="/admin/f/${photoFolderId}"]`)
    .first();
  await expect(photoFolderLink).toBeVisible({ timeout: 15_000 });
  await photoFolderLink.click();
  await page.waitForTimeout(1500);
  await expect(page).toHaveURL(new RegExp(`/admin/f/${photoFolderId}`));
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
  await expect(page.getByText('Login to PICR')).toHaveCount(0);
  expectNoBrowserFailures(failures);
});
