import { expect, test } from '@playwright/test';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { photoFolderId } from '../api/testVariables';
import {
  expectNoBrowserFailures,
  trackBrowserFailures,
} from './browserFailures';
import {
  deleteBrandingMutationText,
  deleteUserMutationText,
  editBrandingMutationText,
  editUserMutationText,
  loginMutationText,
  setFolderBrandingMutationText,
} from './mutations';

type GqlResult<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const testUrl = 'http://localhost:6901/';

async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  headers: HeadersInit = {},
) {
  const response = await fetch(testUrl + 'graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });
  return (await response.json()) as GqlResult<T>;
}

test('public link and login routes load with no browser/runtime errors', async ({
  page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const uuid = `frontend-smoke-${suffix}`;
  const folderId = photoFolderId;
  const username = `frontend-smoke-${suffix}@example.com`;
  const galleryPasscode = `smoke-${suffix}`;
  const loginResult = await gqlRequest<{ auth?: string }>(
    loginMutationText,
    defaultCredentials,
  );
  const authToken = loginResult.data?.auth;
  if (!authToken) {
    throw new Error(
      `Authentication failed: ${JSON.stringify(loginResult.errors ?? [])}`,
    );
  }
  const authHeader = { authorization: `Bearer ${authToken}` };
  let createdUserId: string | undefined;
  let brandingId: string | undefined;

  const failures = trackBrowserFailures(page);

  try {
    const createBrandingResult = await gqlRequest<{
      editBranding?: { id: string };
    }>(
      editBrandingMutationText,
      {
        name: `Public Link Smoke Branding ${suffix}`,
        galleryLayout: 'masonry',
        thumbnailSize: 150,
        thumbnailSpacing: 12,
        thumbnailBorderRadius: 16,
      },
      authHeader,
    );
    expect(createBrandingResult.errors).toBeUndefined();
    brandingId = createBrandingResult.data?.editBranding?.id;
    expect(brandingId).toBeTruthy();

    const assignBrandingResult = await gqlRequest(
      setFolderBrandingMutationText,
      { folderId, brandingId },
      authHeader,
    );
    expect(assignBrandingResult.errors).toBeUndefined();

    const createUserResult = await gqlRequest<{
      editUser?: { id: string };
    }>(
      editUserMutationText,
      {
        folderId,
        name: 'Frontend Smoke User',
        username,
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

    const response = await page.goto(`/s/${uuid}/${folderId}`, {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.ok()).toBeTruthy();

    await page.waitForTimeout(1500);
    await expect(page).toHaveTitle(/PICR/i);
    await expect(page.locator('#root')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Dog Photos' }),
    ).toBeVisible();
    await expect(page.getByLabel('Passcode')).toBeVisible();
    await page.getByLabel('Passcode').fill('wrong-passcode');
    await page.getByRole('button', { name: 'Open gallery' }).click();
    await expect(page.getByText('Incorrect passcode')).toBeVisible();
    await page.getByLabel('Passcode').fill(galleryPasscode);
    await page.getByRole('button', { name: 'Open gallery' }).click();
    await expect(page.getByLabel('Passcode')).toHaveCount(0);
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/s/${uuid}/${folderId}`));

    const gallery = page.locator('#ReactGridGallery');
    await expect(gallery).toBeVisible();
    await expect(
      gallery.locator('.ReactGridGallery_masonry-column').first(),
    ).toBeVisible();
    await expect(
      gallery.locator('[data-testid="grid-gallery-item_viewport"]').first(),
    ).toHaveCSS('border-radius', '16px');
    expectNoBrowserFailures(failures);

    let signalExpiryRefresh!: () => void;
    const expiryRefreshStarted = new Promise<void>((resolve) => {
      signalExpiryRefresh = resolve;
    });
    let releaseExpiryRefresh!: () => void;
    const expiryRefreshReleased = new Promise<void>((resolve) => {
      releaseExpiryRefresh = resolve;
    });
    let holdNextPublicLinkInfo = true;
    await page.route('**/graphql*', async (route) => {
      const request = route.request();
      const body = request.postDataJSON() as {
        operationName?: string;
      } | null;
      const operationName =
        request.method() === 'GET'
          ? new URL(request.url()).searchParams.get('operationName')
          : body?.operationName;
      if (holdNextPublicLinkInfo && operationName === 'PublicLinkInfoQuery') {
        holdNextPublicLinkInfo = false;
        signalExpiryRefresh();
        await expiryRefreshReleased;
      }
      await route.continue();
    });

    const expireDuringRaceResult = await gqlRequest(
      editUserMutationText,
      {
        id: createdUserId,
        folderId,
        name: 'Frontend Smoke User',
        username,
        uuid,
        enabled: true,
        commentPermissions: 'read',
        galleryPasscode,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
      authHeader,
    );
    expect(expireDuringRaceResult.errors).toBeUndefined();

    await expiryRefreshStarted;
    await expect(
      page.getByRole('heading', { name: 'Gallery link expired' }),
    ).toBeVisible();

    const extendDuringRefreshResult = await gqlRequest(
      editUserMutationText,
      {
        id: createdUserId,
        folderId,
        name: 'Frontend Smoke User',
        username,
        uuid,
        enabled: true,
        commentPermissions: 'read',
        galleryPasscode,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
      authHeader,
    );
    expect(extendDuringRefreshResult.errors).toBeUndefined();
    releaseExpiryRefresh();

    await expect(gallery).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Gallery link expired' }),
    ).toHaveCount(0);
    await page.unroute('**/graphql*');

    const expireLinkResult = await gqlRequest(
      editUserMutationText,
      {
        id: createdUserId,
        folderId,
        name: 'Frontend Smoke User',
        username,
        uuid,
        enabled: true,
        commentPermissions: 'read',
        galleryPasscode,
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
      authHeader,
    );
    expect(expireLinkResult.errors).toBeUndefined();

    // The open gallery has several polling queries (including its one-second
    // task poll). The first rejected query should route through the public-link
    // gate instead of opening the global error overlay.
    await expect(
      page.getByRole('heading', { name: 'Gallery link expired' }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByText(/contact the photographer for a new link/i),
    ).toBeVisible();
    await expect(page.getByText('You do not have permission')).toHaveCount(0);
    expectNoBrowserFailures(failures);

    const expiredPageResponse = await page.goto(`/s/${uuid}/${folderId}`, {
      waitUntil: 'domcontentloaded',
    });
    expect(expiredPageResponse?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'Gallery link expired' }),
    ).toBeVisible();
    await expect(page).toHaveTitle('PICR');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'PICR',
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute('content', 'PICR File Sharing');
    await expect(page.locator('meta[property="og:image"]')).not.toHaveAttribute(
      'content',
      /\/image\//,
    );
    expectNoBrowserFailures(failures);

    await page.goto('/route-that-should-hit-login', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText(/^Login to PICR$/)).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
    await page.waitForTimeout(300);
    expectNoBrowserFailures(failures);
  } finally {
    if (createdUserId) {
      await gqlRequest<{ deleteUser?: boolean }>(
        deleteUserMutationText,
        { id: createdUserId },
        authHeader,
      );
    }
    await gqlRequest(
      setFolderBrandingMutationText,
      { folderId, brandingId: null },
      authHeader,
    );
    if (brandingId) {
      await gqlRequest(
        deleteBrandingMutationText,
        { id: brandingId },
        authHeader,
      );
    }
  }
});
