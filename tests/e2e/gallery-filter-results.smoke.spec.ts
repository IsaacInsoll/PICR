import { expect, test } from '@playwright/test';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import {
  expectNoBrowserFailures,
  trackBrowserFailures,
} from './browserFailures';

test('local gallery filters promote to recursive Results without losing lightbox state', async ({
  page,
}) => {
  const failures = trackBrowserFailures(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Username').fill(defaultCredentials.username);
  await page
    .getByRole('textbox', { name: 'Password' })
    .fill(defaultCredentials.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/admin');

  await page.goto('/admin/f/1', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Filter Files' }).click();
  const filterDrawer = page.getByRole('dialog', { name: 'Filter Files' });
  await expect(filterDrawer.getByText('Filename', { exact: true })).toHaveCount(
    0,
  );
  await filterDrawer.getByText('Photos', { exact: true }).click();
  await filterDrawer.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/admin\/f\/1\?media=image$/);
  await expect(page.getByText('0 of 0 shown here')).toBeVisible();

  const showAll = page.getByRole('button', {
    name: '10 more elsewhere · Show all 10',
  });
  await expect(showAll).toBeVisible();
  await showAll.click();
  await expect(page).toHaveURL(/\/admin\/f\/1\?find=1&media=image$/);
  await expect(page.getByText('10 Files · 1 Folder')).toBeVisible();

  const resultTiles = page.locator('[data-testid="grid-gallery-item"]');
  await expect(resultTiles).toHaveCount(10);
  const firstResultLink = resultTiles.locator('a').first();
  await expect(firstResultLink).toHaveAttribute(
    'href',
    /\/admin\/f\/1\/\d+\?find=1&media=image/,
  );
  await firstResultLink.click();
  await expect(page).toHaveURL(/\/admin\/f\/1\/\d+\?find=1&media=image/);
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/admin\/f\/1\?find=1&media=image$/);

  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/admin\/f\/1\?media=image$/);
  await expect(page.getByText('0 of 0 shown here')).toBeVisible();

  const find = page.getByRole('searchbox', {
    name: 'Search filenames and folders within Home',
  });
  await find.pressSequentially('vertical');
  await expect(find).toHaveValue('vertical');
  await expect(page).toHaveURL(/\/admin\/f\/1\?find=1&q=vertical&media=image$/);
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await expect(page).toHaveURL(/\/admin\/f\/1\?media=image$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/admin\/f\/1\?find=1&q=vertical&media=image$/);
  await expect(find).toHaveValue('vertical');

  await page.goto('/admin/f/1?camera=Canon', {
    waitUntil: 'domcontentloaded',
  });
  const metadataFind = page.getByRole('searchbox', {
    name: 'Search filenames and folders within Home',
  });
  await metadataFind.click();
  await expect(page).toHaveURL(/\/admin\/f\/1\?camera=Canon$/);
  await metadataFind.pressSequentially('vertical');
  await expect(metadataFind).toHaveValue('vertical');
  await expect(page).toHaveURL(
    /\/admin\/f\/1\?find=1&q=vertical&camera=Canon$/,
  );
  await expect(
    page.getByText(
      'Camera, lens, and exposure filters are paused while searching. Back to Home restores them.',
    ),
  ).toBeVisible();
  expectNoBrowserFailures(failures);
});
