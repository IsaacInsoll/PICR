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
  const resultsBar = page.getByTestId('gallery-results-bar');
  await expect(resultsBar).toBeVisible();
  await resultsBar.getByRole('button', { name: 'Download' }).click();
  await expect(
    page.getByRole('menuitem', { name: '10 results' }),
  ).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Entire Home folder' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  // Repeating the same folder on every tile adds noise when the result set only
  // comes from one folder. List view retains its explicit Folder column.
  await expect(page.getByTestId('result-folder-context')).toHaveCount(0);

  await resultsBar.getByRole('button', { name: 'All folders' }).click();
  await page.getByRole('button', { name: 'Browse within Dog Photos' }).click();
  await expect(page.getByText('No further folders')).toBeVisible();
  await page.getByRole('button', { name: 'Back to parent folder' }).click();
  await page
    .getByRole('checkbox', { name: 'Include results from Dog Photos' })
    .click();
  await expect(page).toHaveURL(/\/admin\/f\/1\?find=1&folder=\d+&media=image$/);
  await expect(
    resultsBar.getByRole('button', { name: 'Folders' }),
  ).toBeVisible();

  for (const viewport of [
    { width: 820, height: 1180 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(resultsBar).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(viewport.width);
  }
  await page.setViewportSize({ width: 1280, height: 720 });

  const resultTiles = page.locator('[data-testid="grid-gallery-item"]');
  await expect(resultTiles).toHaveCount(10);
  const firstResultLink = resultTiles.locator('a').first();
  await expect(firstResultLink).toHaveAttribute(
    'href',
    /\/admin\/f\/1\/\d+\?find=1&folder=\d+&media=image/,
  );
  await firstResultLink.click();
  await expect(page).toHaveURL(
    /\/admin\/f\/1\/\d+\?find=1&folder=\d+&media=image/,
  );
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/admin\/f\/1\?find=1&folder=\d+&media=image$/);

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

  await page.goto('/admin/f/3?media=image', {
    waitUntil: 'domcontentloaded',
  });
  const filteredGalleryTiles = page.locator(
    '[data-testid="grid-gallery-item"]',
  );
  await expect(filteredGalleryTiles).toHaveCount(10);
  await filteredGalleryTiles.locator('a').first().click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/\/admin\/f\/3\?media=image$/);
  await expect(filteredGalleryTiles).toHaveCount(10);

  await page.goto('/admin/f/1?camera=Canon', {
    waitUntil: 'domcontentloaded',
  });
  const metadataFind = page.getByRole('searchbox', {
    name: 'Search filenames and folders within Home',
  });
  await metadataFind.click();
  await expect(page).toHaveURL(/\/admin\/f\/1\?camera=Canon$/);
  await metadataFind.press('Enter');
  await expect(page).toHaveURL(/\/admin\/f\/1\?find=1&camera=Canon$/);
  await expect(
    page
      .getByTestId('gallery-results-bar')
      .getByRole('button', { name: 'Clear Filters' }),
  ).toHaveCount(0);
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

test('reviewing recursive Results keeps the materialized sequence stable', async ({
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

  await page.goto('/admin/f/1?find=1&media=image&flag=none', {
    waitUntil: 'domcontentloaded',
  });
  const resultTiles = page.locator('[data-testid="grid-gallery-item"]');
  await expect(resultTiles).toHaveCount(10);
  await resultTiles.locator('a').first().click();

  const firstFileUrl = page.url();
  const sourceFolder = page.getByRole('link', {
    name: 'Open Folder: Dog Photos',
  });
  await expect(sourceFolder).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).not.toHaveURL(firstFileUrl);
  await page.getByRole('button', { name: 'Close' }).click();

  await expect(resultTiles).toHaveCount(10);
  await expect(page.getByText('1 result no longer matches')).toBeVisible();
  await page
    .getByTestId('gallery-results-bar')
    .getByRole('button', { name: 'Download' })
    .click();
  await expect(
    page.getByRole('menuitem', { name: '10 results' }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      'Refresh these changed results before downloading the exact selection.',
    ),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Refresh' }).click();
  await expect(resultTiles).toHaveCount(9);
  await expect(page.getByText('1 result no longer matches')).toHaveCount(0);

  await page.goto(firstFileUrl, { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByText(
      'This file no longer matches the current search and filters.',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Return to results' }).click();
  await expect(resultTiles).toHaveCount(9);

  // Restore the fixture so subsequent smoke tests see the original review
  // state through a Results URL that does not exclude the approved file.
  const restoreUrl = new URL(firstFileUrl);
  restoreUrl.search = '?find=1&media=image';
  await page.goto(restoreUrl.toString(), { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Approve' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('[data-testid="grid-gallery-item"]')).toHaveCount(
    10,
  );
  expectNoBrowserFailures(failures);
});
