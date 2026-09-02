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
    const errorText = request.failure()?.errorText ?? '';

    // Chromium aborts in-flight lazy preloads when a navigation no longer
    // needs them. Those cancellations are expected; other script/document
    // failures still indicate a broken browser load.
    if (
      (resourceType === 'script' || resourceType === 'document') &&
      errorText !== 'net::ERR_ABORTED'
    ) {
      failures.requestFailures.push(
        `${resourceType} ${request.url()} ${errorText}`,
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
