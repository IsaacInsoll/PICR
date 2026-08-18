import { expect, test } from '@playwright/test';
import { photoFolderId, testUrl } from '../api/testVariables';
import {
  expectNoBrowserFailures,
  trackBrowserFailures,
} from './browserFailures';
import { adminAuthHeader, gqlRequest } from './graphqlClient';
import { deleteUserMutationText, editUserMutationText } from './mutations';

test('French public gallery, passcode, login, and language persistence', async ({
  browser,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const uuid = `i18n-smoke-${suffix}`;
  const galleryPasscode = `i18n-${suffix}`;
  const authHeader = await adminAuthHeader();
  let createdUserId: string | undefined;

  const context = await browser.newContext({
    baseURL: testUrl,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const failures = trackBrowserFailures(page);

  try {
    const createUserResult = await gqlRequest<{
      editUser?: { id: string };
    }>(
      editUserMutationText,
      {
        folderId: photoFolderId,
        name: 'I18n Smoke User',
        username: `i18n-smoke-${suffix}@example.com`,
        uuid,
        enabled: true,
        commentPermissions: 'read',
        galleryPasscode,
      },
      authHeader,
    );

    expect(createUserResult.errors).toBeUndefined();
    createdUserId = createUserResult.data?.editUser?.id;
    expect(createdUserId).toBeTruthy();

    await page.goto(`/s/${uuid}/${photoFolderId}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByLabel('Code d’accès')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Ouvrir la galerie' }),
    ).toBeVisible();

    await page.getByRole('combobox', { name: 'Langue' }).click();
    await page.getByRole('option', { name: 'English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByLabel('Passcode')).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByLabel('Passcode')).toBeVisible();

    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'Français' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByLabel('Code d’accès')).toBeVisible();

    await page.getByLabel('Code d’accès').fill('wrong-passcode');
    await page.getByRole('button', { name: 'Ouvrir la galerie' }).click();
    await expect(page.getByText('Code d’accès incorrect')).toBeVisible();

    await page.getByLabel('Code d’accès').fill(galleryPasscode);
    await page.getByRole('button', { name: 'Ouvrir la galerie' }).click();
    await expect(page.getByLabel('Code d’accès')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: 'Dog Photos' }),
    ).toBeVisible();
    await expect(
      page.getByText('10 fichiers', { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Langue' })).toBeVisible();

    await page.goto('/route-that-should-hit-login', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByText('Connexion à PICR')).toBeVisible();
    await expect(page.getByLabel('Nom d’utilisateur')).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: 'Mot de passe' }),
    ).toBeVisible();
    expectNoBrowserFailures(failures);
  } finally {
    await context.close();
    if (createdUserId) {
      await gqlRequest<{ deleteUser?: boolean }>(
        deleteUserMutationText,
        { id: createdUserId },
        authHeader,
      );
    }
  }
});

test('unsupported browser locale falls back to English catalogs', async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: testUrl,
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
  });
  const page = await context.newPage();
  const failures = trackBrowserFailures(page);

  try {
    await page.goto('/route-that-should-hit-login', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Login to PICR')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    expectNoBrowserFailures(failures);
  } finally {
    await context.close();
  }
});
