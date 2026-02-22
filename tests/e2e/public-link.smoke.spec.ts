import { expect, test, type Page } from '@playwright/test';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { photoFolderId } from '../api/testVariables';
import {
  deleteUserMutationText,
  editUserMutationText,
  loginMutationText,
} from './mutations';

type GqlResult<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

const testUrl = 'http://localhost:6901/';

type BrowserFailureSignals = {
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
};

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

function trackBrowserFailures(page: Page) {
  const failures: BrowserFailureSignals = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
  };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      failures.consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    failures.pageErrors.push(error.message);
  });

  page.on('requestfailed', (request) => {
    const resourceType = request.resourceType();
    if (resourceType === 'script' || resourceType === 'document') {
      failures.requestFailures.push(
        `${resourceType} ${request.url()} ${request.failure()?.errorText ?? ''}`,
      );
    }
  });

  return failures;
}

function expectNoBrowserFailures(failures: BrowserFailureSignals) {
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.pageErrors).toEqual([]);
  expect(failures.requestFailures).toEqual([]);
}

test('public link and login routes load with no browser/runtime errors', async ({
  page,
}) => {
  const suffix = Math.random().toString(36).slice(2, 8);
  const uuid = `frontend-smoke-${suffix}`;
  const folderId = photoFolderId;
  const username = `frontend-smoke-${suffix}@example.com`;
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

  const failures = trackBrowserFailures(page);

  try {
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
    await expect(page.getByText('Something went wrong')).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/s/${uuid}/${folderId}`));
    expectNoBrowserFailures(failures);

    await page.goto('/route-that-should-hit-login', {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText(/^Login to PICR$/)).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
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
  }
});
