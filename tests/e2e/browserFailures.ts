import { expect, type Page } from '@playwright/test';

// Shared smoke-test helpers: collect hard browser/runtime failure signals so a
// spec can assert the app rendered cleanly (no thrown errors, no dead scripts,
// no console errors). Image/font request failures are intentionally ignored —
// only script/document loads count as breakage.
export type BrowserFailureSignals = {
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
};

export function trackBrowserFailures(page: Page): BrowserFailureSignals {
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

export function expectNoBrowserFailures(failures: BrowserFailureSignals) {
  expect(failures.consoleErrors).toEqual([]);
  expect(failures.pageErrors).toEqual([]);
  expect(failures.requestFailures).toEqual([]);
}
