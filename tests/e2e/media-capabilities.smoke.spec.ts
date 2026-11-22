import { expect, test } from '@playwright/test';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { expectDashboardReady } from './dashboardReady';
import {
  expectNoBrowserFailures,
  trackBrowserFailures,
} from './browserFailures';

test('Media settings shows the detected JPEG XL capability', async ({
  page,
}, testInfo) => {
  const failures = trackBrowserFailures(page);
  await page.goto('/');
  await page.getByLabel('Username').fill(defaultCredentials.username);
  await page
    .getByRole('textbox', { name: 'Password', exact: true })
    .fill(defaultCredentials.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expectDashboardReady(page);
  await page.goto('/admin/settings/media');
  const badge = page
    .locator('.mantine-Badge-root')
    .filter({ hasText: /^JPEG XL$/ });
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute('data-variant', 'light');
  await page.screenshot({
    path: testInfo.outputPath('media-capabilities.png'),
    fullPage: true,
  });
  expectNoBrowserFailures(failures);
});
