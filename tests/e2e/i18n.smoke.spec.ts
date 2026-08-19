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
  editBrandingMutationText,
  editUserMutationText,
  setFolderBrandingMutationText,
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

    // Language switcher soft-disabled (#84). Restore this block, which covered
    // manual selection and persistence across reloads, when the UI returns.
    // await page.getByRole('combobox', { name: 'Langue' }).click();
    // await page.getByRole('option', { name: 'English' }).click();
    // await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // await expect(page.getByLabel('Passcode')).toBeVisible();
    //
    // await page.reload({ waitUntil: 'domcontentloaded' });
    // await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // await expect(page.getByLabel('Passcode')).toBeVisible();
    //
    // await page.getByRole('combobox', { name: 'Language' }).click();
    // await page.getByRole('option', { name: 'Français' }).click();
    // await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    //
    // await page.reload({ waitUntil: 'domcontentloaded' });
    // await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    // await expect(page.getByLabel('Code d’accès')).toBeVisible();

    // The `?lng=` override still selects a catalog without the switcher.
    await page.goto(`/s/${uuid}/${photoFolderId}?lng=en`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByLabel('Passcode')).toBeVisible();

    await page.goto(`/s/${uuid}/${photoFolderId}`, {
      waitUntil: 'domcontentloaded',
    });
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
    // Language switcher soft-disabled (#84) — restore with the gallery action.
    // await expect(page.getByRole('combobox', { name: 'Langue' })).toBeVisible();

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

test('unsupported browser locale falls back to English and honors a Greek query override', async ({
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

    await page.goto('/route-that-should-hit-login?lng=el', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'el');
    await expect(page.getByText('Σύνδεση στο PICR')).toBeVisible();

    await page.goto('/route-that-should-hit-login', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByText('Login to PICR')).toBeVisible();
    expectNoBrowserFailures(failures);
  } finally {
    await context.close();
  }
});

test('Greek browser locale renders gallery and admin surfaces with a safe heading font stack', async ({
  browser,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const uuid = `i18n-greek-${suffix}`;
  const authHeader = await adminAuthHeader();
  let createdUserId: string | undefined;
  let brandingId: string | undefined;

  const context = await browser.newContext({
    baseURL: testUrl,
    locale: 'el-GR',
    timezoneId: 'Europe/Athens',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const failures = trackBrowserFailures(page);

  try {
    const createBrandingResult = await gqlRequest<{
      editBranding?: { id: string };
    }>(
      editBrandingMutationText,
      {
        name: `Greek i18n smoke ${suffix}`,
        headingFontKey: 'bebasNeue',
        footerTitle: 'Ελληνικός τίτλος',
      },
      authHeader,
    );
    expect(createBrandingResult.errors).toBeUndefined();
    brandingId = createBrandingResult.data?.editBranding?.id;
    expect(brandingId).toBeTruthy();

    const assignBrandingResult = await gqlRequest(
      setFolderBrandingMutationText,
      { folderId: photoFolderId, brandingId },
      authHeader,
    );
    expect(assignBrandingResult.errors).toBeUndefined();

    const createUserResult = await gqlRequest<{
      editUser?: { id: string };
    }>(
      editUserMutationText,
      {
        folderId: photoFolderId,
        name: 'Ελληνικά i18n smoke',
        username: `i18n-greek-${suffix}@example.com`,
        uuid,
        enabled: true,
        commentPermissions: 'read',
      },
      authHeader,
    );

    expect(createUserResult.errors).toBeUndefined();
    createdUserId = createUserResult.data?.editUser?.id;
    expect(createdUserId).toBeTruthy();

    await page.goto(`/s/${uuid}/${photoFolderId}`, {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.locator('html')).toHaveAttribute('lang', 'el');
    await expect(
      page.getByRole('heading', { name: 'Dog Photos' }),
    ).toBeVisible();
    await expect(
      page.getByText('10 αρχεία', { exact: true }).first(),
    ).toBeVisible();

    const greekFooterTitle = page.getByText('Ελληνικός τίτλος', {
      exact: true,
    });
    await expect(greekFooterTitle).toBeVisible();
    const selectedHeadingFont = await page
      .locator('html')
      .evaluate((html) =>
        getComputedStyle(html).getPropertyValue('--picr-heading-font').trim(),
      );
    expect(selectedHeadingFont).toMatch(/^"Bebas Neue", Roboto, /);
    const footerFontFamily = await greekFooterTitle.evaluate(
      (footerTitle) => getComputedStyle(footerTitle).fontFamily,
    );
    expect(footerFontFamily).toMatch(/^"Bebas Neue", Roboto, /);
    expect(footerFontFamily).toContain('sans-serif');

    expectNoBrowserFailures(failures);
    await page.close();

    // Keep the public link and admin login in separate app instances. Logging
    // in updates shared storage, which would restart an open public-link tab.
    const adminPage = await context.newPage();
    const adminFailures = trackBrowserFailures(adminPage);
    await adminPage.goto('/admin/settings', {
      waitUntil: 'domcontentloaded',
    });
    await expect(adminPage.getByText('Σύνδεση στο PICR')).toBeVisible();
    await adminPage
      .getByLabel('Όνομα χρήστη')
      .fill(defaultCredentials.username);
    await adminPage
      .getByRole('textbox', { name: 'Κωδικός πρόσβασης' })
      .fill(defaultCredentials.password);
    await adminPage.getByRole('button', { name: 'Σύνδεση' }).click();

    const settingsHeading = adminPage.getByRole('heading', {
      name: 'Ρυθμίσεις PICR',
    });
    await expect(settingsHeading).toBeVisible();
    await expect(
      adminPage.getByRole('tab', { name: 'Εταιρική ταυτότητα' }),
    ).toBeVisible();

    const headingFontFamily = await settingsHeading.evaluate(
      (heading) => getComputedStyle(heading).fontFamily,
    );
    expect(headingFontFamily).toMatch(/^Signika, Roboto, /);
    expect(headingFontFamily).toContain('sans-serif');
    expectNoBrowserFailures(adminFailures);
  } finally {
    await context.close();
    if (createdUserId) {
      await gqlRequest<{ deleteUser?: boolean }>(
        deleteUserMutationText,
        { id: createdUserId },
        authHeader,
      );
    }
    if (brandingId) {
      await gqlRequest(
        setFolderBrandingMutationText,
        { folderId: photoFolderId, brandingId: null },
        authHeader,
      );
      await gqlRequest<{ deleteBranding?: boolean }>(
        deleteBrandingMutationText,
        { id: brandingId },
        authHeader,
      );
    }
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

    // Language switcher soft-disabled (#84). Restore the header menu selection
    // below in place of the `?lng=` navigation when the UI returns.
    // await page
    //   .locator('header')
    //   .getByRole('button')
    //   .filter({ hasText: 'PICR Admin' })
    //   .hover();
    // await page.getByRole('combobox', { name: 'Language' }).click();
    // await page.getByRole('option', { name: 'Français' }).click();
    await page.goto('/admin?lng=fr', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByText('Vos galeries')).toBeVisible();
    await expect(page.getByText('Retours des clients')).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByText('Vos galeries')).toBeVisible();

    await page.goto('/admin/settings/branding?lng=fr', {
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
