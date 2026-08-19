import { expect, test } from '@playwright/test';
import { photoFolderId, testUrl } from '../api/testVariables';
import {
  expectNoBrowserFailures,
  trackBrowserFailures,
} from './browserFailures';
import { adminAuthHeader, gqlRequest } from './graphqlClient';
import {
  deleteBrandingMutationText,
  deleteUserMutationText,
  editUserMutationText,
} from './mutations';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';

const viewBrandingsQueryText = /* GraphQL */ `
  query ViewBrandingsForI18nSmoke {
    brandings {
      id
      name
    }
  }
`;

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

test('French admin navigation persists and the branding editor works', async ({
  page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const brandingName = `I18n admin smoke ${suffix}`;
  const failures = trackBrowserFailures(page);
  const authHeader = await adminAuthHeader();

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Username').fill(defaultCredentials.username);
    await page
      .getByRole('textbox', { name: 'Password' })
      .fill(defaultCredentials.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/admin', { timeout: 15_000 });

    await expect(page.getByText('Your Galleries')).toBeVisible();
    await page
      .locator('header')
      .getByRole('button')
      .filter({ hasText: 'PICR Admin' })
      .hover();
    await page.getByRole('combobox', { name: 'Language' }).click();
    await page.getByRole('option', { name: 'Français' }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByText('Vos galeries')).toBeVisible();
    await expect(page.getByText('Retours des clients')).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByText('Vos galeries')).toBeVisible();

    await page.goto('/admin/settings/branding', {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      page.getByRole('heading', { name: 'Paramètres de PICR' }),
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Identité visuelle' }),
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Ajouter une identité visuelle' })
      .click();
    const drawer = page.getByRole('dialog');
    await expect(drawer.getByText('Créer une identité visuelle')).toBeVisible();
    await drawer
      .getByRole('textbox', { name: 'Nom', exact: true })
      .fill(brandingName);
    await drawer.getByRole('button', { name: 'Créer', exact: true }).click();

    await expect(drawer).toHaveCount(0);
    await expect(page.getByText(brandingName, { exact: true })).toBeVisible();

    await page.getByText(brandingName, { exact: true }).click();
    await expect(
      drawer.getByRole('textbox', { name: 'Nom', exact: true }),
    ).toHaveValue(brandingName);
    await drawer.getByRole('button', { name: 'Supprimer' }).click();
    await expect(page.getByText(brandingName, { exact: true })).toHaveCount(0);
    expectNoBrowserFailures(failures);
  } finally {
    const result = await gqlRequest<{
      brandings?: Array<{ id: string; name?: string | null }>;
    }>(viewBrandingsQueryText, {}, authHeader);
    for (const branding of result.data?.brandings ?? []) {
      if (branding.name !== brandingName) continue;
      await gqlRequest<{ deleteBranding?: boolean }>(
        deleteBrandingMutationText,
        { id: branding.id },
        authHeader,
      );
    }
  }
});
