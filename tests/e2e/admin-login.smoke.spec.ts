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
  let accessLogRequests = 0;
  page.on('request', (request) => {
    if (!request.url().includes('/graphql')) return;
    const body =
      request.method() === 'POST'
        ? (request.postDataJSON() as {
            operationName?: string;
            query?: string;
          } | null)
        : null;
    const operationName =
      request.method() === 'GET'
        ? new URL(request.url()).searchParams.get('operationName')
        : body?.operationName;
    if (
      operationName === 'AccessLogsQuery' ||
      body?.query?.includes('query AccessLogsQuery')
    ) {
      accessLogRequests += 1;
    }
  });

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
  await expect(page.getByRole('link', { name: 'Create Link' })).toBeVisible();
  const manageFolderLink = page.getByRole('link', { name: 'Manage folder' });
  await expect(manageFolderLink).toBeVisible();
  await expect(manageFolderLink).toHaveAttribute(
    'href',
    `/admin/f/${photoFolderId}/manage/folder`,
  );
  await expect(
    page.locator('[data-testid="folder-contents-toolbar"]'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Activity' })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Folder actions' }).click();
  await expect(
    page.getByRole('menuitem', { name: 'View Activity' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: 'Create Link' }).click();
  const newLinkDialog = page.getByRole('dialog', {
    name: /Manage public link for/,
  });
  await expect(newLinkDialog).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: /Manage Folder:/ }),
  ).toHaveCount(0);
  await expect(newLinkDialog.getByRole('tab')).toHaveCount(0);
  await newLinkDialog.getByLabel('Name').fill('Toolbar Test Link');
  await newLinkDialog.getByRole('button', { name: 'Create Link' }).click();
  await expect(newLinkDialog).toHaveCount(0);
  await page.waitForURL(new RegExp(`/admin/f/${photoFolderId}$`));

  const testLinkAvatar = page.getByRole('link', {
    name: 'Manage public link for Toolbar Test Link',
  });
  await expect(testLinkAvatar).toBeVisible();
  await testLinkAvatar.hover();
  const linkTooltip = page.locator('.mantine-Tooltip-tooltip:visible');
  await expect(linkTooltip).toBeVisible();
  await expect(linkTooltip).toContainText('Toolbar Test Link');
  await expect(linkTooltip).toContainText('Enabled');
  await expect(linkTooltip).toContainText('Last Access: Never');
  await testLinkAvatar.click();

  const editLinkDialog = page.getByRole('dialog', {
    name: /Manage public link for/,
  });
  await expect(
    page.getByRole('dialog', { name: /Manage Folder:/ }),
  ).toHaveCount(0);
  await editLinkDialog.getByRole('button', { name: 'Close' }).click();
  await expect(editLinkDialog).toHaveCount(0);
  await page.waitForURL(new RegExp(`/admin/f/${photoFolderId}$`));
  await testLinkAvatar.click();

  await expect(editLinkDialog.getByRole('tab', { name: 'Edit' })).toBeVisible();
  await expect(
    editLinkDialog.getByRole('tab', { name: 'Access Logs' }),
  ).toBeVisible();
  expect(accessLogRequests).toBe(0);
  await editLinkDialog.getByRole('tab', { name: 'Access Logs' }).click();
  await expect(
    editLinkDialog.getByText(
      'Nobody has used a public link to view this folder yet',
    ),
  ).toBeVisible();
  await expect.poll(() => accessLogRequests).toBe(1);
  await expect(
    editLinkDialog.getByRole('button', { name: 'Copy public link' }),
  ).toBeVisible();
  await expect(
    editLinkDialog.getByRole('button', { name: 'Save' }),
  ).toBeVisible();

  await editLinkDialog.getByRole('button', { name: 'Delete' }).click();
  const deleteDialog = page.getByRole('dialog', {
    name: 'Delete Public Link',
  });
  await deleteDialog.getByRole('button', { name: 'Delete' }).click();
  await expect(editLinkDialog).toHaveCount(0);
  await expect(deleteDialog).toHaveCount(0);
  await page.waitForURL(new RegExp(`/admin/f/${photoFolderId}$`));

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('link', { name: 'Create Link' })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Links: 0' })).toBeVisible();
  expectNoBrowserFailures(failures);

  // Closing an editor opened from the gallery should consume its history entry,
  // so Back returns to the dashboard rather than landing on a duplicate gallery.
  await page.goBack();
  await page.waitForURL('**/admin');
  await expectDashboardReady(page);
});
