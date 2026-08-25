import { expect, type Page } from '@playwright/test';

const dashboardReadyTimeout = 15_000;

export const expectDashboardReady = async (
  page: Page,
  options: {
    galleriesHeading?: string;
    feedbackHeading?: string;
  } = {},
) => {
  const {
    galleriesHeading = 'Your Galleries',
    feedbackHeading = 'Client Feedback',
  } = options;

  await expect(
    page.getByRole('heading', { name: galleriesHeading }),
  ).toBeVisible({ timeout: dashboardReadyTimeout });
  await expect(
    page.getByRole('heading', { name: feedbackHeading }),
  ).toBeVisible({ timeout: dashboardReadyTimeout });
};
