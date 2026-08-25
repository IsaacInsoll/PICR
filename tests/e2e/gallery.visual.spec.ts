import { expect, test, type Locator, type Page } from '@playwright/test';
import { defaultCredentials } from '../../backend/auth/defaultCredentials';
import { photoFolderId, videoFolderId } from '../api/testVariables';
import {
  expectNoBrowserFailures,
  trackBrowserFailures,
} from './browserFailures';
import { expectDashboardReady } from './dashboardReady';
import { adminAuthHeader, gqlRequest } from './graphqlClient';
import {
  deleteBrandingMutationText,
  editBrandingMutationText,
  setFolderBrandingMutationText,
} from './mutations';

// Inherited-layout baselines for the gallery implementation. Every scenario
// drives the real PICR gallery against the committed media fixtures; the
// gallery container width is forced independently of the viewport so row
// layout regressions are reproducible. See tests/AGENTS.md before regenerating
// any snapshot.
const rootFolderId = '1';
const tileSelector = '[data-testid="grid-gallery-item"]';
const viewportSelector = '[data-testid="grid-gallery-item_viewport"]';

// Branding defaults (see shared/branding/galleryPresets.ts). thumbnailSize
// becomes the gallery rowHeight and thumbnailSpacing becomes its margin, so
// the row assertions are expressed relative to both.
const defaultRowHeight = 210;
const defaultMargin = 4;

type GalleryScenario = {
  name: string;
  viewport: { width: number; height: number };
  containerWidth: number;
  underfilledFinalRow: boolean;
};

const imageScenarios: GalleryScenario[] = [
  {
    name: 'desktop-wide',
    viewport: { width: 1440, height: 1000 },
    containerWidth: 1200,
    underfilledFinalRow: true,
  },
  {
    name: 'desktop-narrow',
    viewport: { width: 1440, height: 1000 },
    containerWidth: 420,
    underfilledFinalRow: false,
  },
  {
    name: 'tablet',
    viewport: { width: 820, height: 1180 },
    containerWidth: 700,
    underfilledFinalRow: true,
  },
  {
    name: 'mobile',
    viewport: { width: 390, height: 844 },
    containerWidth: 350,
    underfilledFinalRow: false,
  },
];

test('image tiles keep their inherited justified row layout', async ({
  context,
  page,
}) => {
  const failures = trackBrowserFailures(page);
  await useGalleryView(page);
  await login(page);
  await openFolder(page, photoFolderId);

  const gallery = page.locator('#ReactGridGallery');
  const tiles = gallery.locator(tileSelector);
  await expect(gallery).toBeVisible();
  await expect(tiles).toHaveCount(10);
  await waitForGalleryImages(page, gallery, 10);

  for (const scenario of imageScenarios) {
    await page.setViewportSize(scenario.viewport);
    await setGalleryWidth(page, gallery, scenario.containerWidth);
    await expectGalleryRows(gallery, scenario.containerWidth, {
      underfilledFinalRow: scenario.underfilledFinalRow,
      rowHeight: defaultRowHeight,
      margin: defaultMargin,
    });
    await expect(gallery).toHaveScreenshot(`${scenario.name}.png`, {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    });
  }

  // Behaviour: every image tile is a real link, a modified click opens a new
  // tab, and a plain click navigates in-app and opens the lightbox.
  await page.setViewportSize(imageScenarios[0].viewport);
  await setGalleryWidth(page, gallery, imageScenarios[0].containerWidth);

  const firstLinkedTile = gallery.locator(`a${viewportSelector}`).first();
  const href = await firstLinkedTile.getAttribute('href');
  if (href === null) {
    throw new Error('The first linked image tile has no href');
  }
  expect(href).toMatch(new RegExp(`^/admin/f/${photoFolderId}/\\d+$`));

  const popupPromise = context.waitForEvent('page');
  await firstLinkedTile.click({ modifiers: ['Control'] });
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup).toHaveURL(new RegExp(`${escapeRegExp(href)}$`));
  await popup.close();
  await expect(page).toHaveURL(new RegExp(`/admin/f/${photoFolderId}$`));

  await firstLinkedTile.click();
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href)}$`));
  await expect(page.locator('.yarl__container')).toBeVisible();

  expectNoBrowserFailures(failures);
});

test('folder tiles render as linked 2:1 tiles', async ({ page }) => {
  const failures = trackBrowserFailures(page);
  await useGalleryView(page);
  await login(page);
  await openFolder(page, rootFolderId);

  const gallery = page.locator('#ReactGridGallery');
  const tiles = gallery.locator(tileSelector);
  await expect(gallery).toBeVisible();
  await expect(tiles).toHaveCount(2);

  // Folder tiles are `src: ''` with a PicrFolder thumbnail drawn as a CSS
  // background, so there is no <img> load event to wait on.
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.mouse.move(0, 0);

  // Every folder tile is a real link; none fall back to the <div> branch.
  const linkedTiles = gallery.locator(`a${viewportSelector}`);
  await expect(linkedTiles).toHaveCount(2);
  const hrefs = await linkedTiles.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('href') ?? ''),
  );
  expect(hrefs).not.toContain('');
  expect([...hrefs].sort()).toEqual(
    [`/admin/f/${videoFolderId}`, `/admin/f/${photoFolderId}`].sort(),
  );

  for (const scenario of [
    { name: 'folders-wide', viewport: imageScenarios[0].viewport, width: 1200 },
    {
      name: 'folders-mobile',
      viewport: imageScenarios[3].viewport,
      width: 350,
    },
  ]) {
    await page.setViewportSize(scenario.viewport);
    await setGalleryWidth(page, gallery, scenario.width);
    await expectFolderTileAspect(gallery);
    await expect(gallery).toHaveScreenshot(`${scenario.name}.png`, {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    });
  }

  // Behaviour: a plain click on a folder tile navigates into that folder,
  // which is a different path from the file tile's lightbox click.
  await page.setViewportSize(imageScenarios[0].viewport);
  await setGalleryWidth(page, gallery, 1200);
  await gallery
    .locator(`a${viewportSelector}[href="/admin/f/${photoFolderId}"]`)
    .click();
  await expect(page).toHaveURL(new RegExp(`/admin/f/${photoFolderId}$`));
  await expect(
    page.locator('#ReactGridGallery').locator(tileSelector),
  ).toHaveCount(10);

  expectNoBrowserFailures(failures);
});

test('video tiles render without a link', async ({ page }) => {
  const failures = trackBrowserFailures(page);
  // PicrVideoPreview cycles its scrub frame on a 1s interval, so the tile is
  // only reproducible with timers frozen.
  await page.clock.install();
  await useGalleryView(page);
  await login(page);
  await openFolder(page, videoFolderId);

  const gallery = page.locator('#ReactGridGallery');
  const tiles = gallery.locator(tileSelector);
  await expect(gallery).toBeVisible();
  await expect(tiles).toHaveCount(1);
  await waitForGalleryImages(page, gallery, 1);
  await page.mouse.move(0, 0);

  // A video carries no href, so the tile viewport stays a plain <div>. This is
  // the other half of the linked-tile branch covered by the image scenario.
  await expect(gallery.locator(`a${viewportSelector}`)).toHaveCount(0);
  await expect(gallery.locator(`div${viewportSelector}`)).toHaveCount(1);

  for (const scenario of [
    { name: 'video-wide', viewport: imageScenarios[0].viewport, width: 1200 },
    { name: 'video-mobile', viewport: imageScenarios[3].viewport, width: 350 },
  ]) {
    await page.setViewportSize(scenario.viewport);
    await setGalleryWidth(page, gallery, scenario.width);
    await expect(gallery).toHaveScreenshot(`${scenario.name}.png`, {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    });
  }

  expectNoBrowserFailures(failures);
});

test('custom branding changes row height, spacing and corner radius', async ({
  page,
}) => {
  // thumbnailSize drives rowHeight, thumbnailSpacing drives margin (used by
  // both row fitting and the tile box), and thumbnailBorderRadius drives
  // tileViewportStyle. Defaults are 210/4/4, so this uses the opposite end of
  // every preset range to make an off-by-one in any of them visible.
  const brandingRowHeight = 150;
  const brandingMargin = 16;
  const headers = await adminAuthHeader();
  let brandingId: string | undefined;

  const failures = trackBrowserFailures(page);
  try {
    const created = await gqlRequest<{ editBranding?: { id: string } }>(
      editBrandingMutationText,
      {
        name: 'Gallery Visual Baseline',
        thumbnailSize: brandingRowHeight,
        thumbnailSpacing: brandingMargin,
        thumbnailBorderRadius: 16,
      },
      headers,
    );
    expect(created.errors).toBeUndefined();
    brandingId = created.data?.editBranding?.id;
    expect(brandingId).toBeTruthy();

    const assigned = await gqlRequest(
      setFolderBrandingMutationText,
      { folderId: photoFolderId, brandingId },
      headers,
    );
    expect(assigned.errors).toBeUndefined();

    await useGalleryView(page);
    await login(page);
    await openFolder(page, photoFolderId);

    const gallery = page.locator('#ReactGridGallery');
    const tiles = gallery.locator(tileSelector);
    await expect(gallery).toBeVisible();
    await expect(tiles).toHaveCount(10);
    await waitForGalleryImages(page, gallery, 10);

    for (const scenario of [
      {
        name: 'branding-wide',
        viewport: imageScenarios[0].viewport,
        width: 1200,
        underfilledFinalRow: true,
      },
      {
        name: 'branding-narrow',
        viewport: imageScenarios[0].viewport,
        width: 420,
        underfilledFinalRow: false,
      },
    ]) {
      await page.setViewportSize(scenario.viewport);
      await setGalleryWidth(page, gallery, scenario.width);
      await expectGalleryRows(gallery, scenario.width, {
        underfilledFinalRow: scenario.underfilledFinalRow,
        rowHeight: brandingRowHeight,
        margin: brandingMargin,
      });
      await expect(gallery).toHaveScreenshot(`${scenario.name}.png`, {
        animations: 'disabled',
        caret: 'hide',
        scale: 'css',
      });
    }

    expectNoBrowserFailures(failures);
  } finally {
    // Specs share one database within a run (workers: 1, no per-spec reset),
    // so branding must be unwound or it leaks into later specs.
    await gqlRequest(
      setFolderBrandingMutationText,
      { folderId: photoFolderId, brandingId: null },
      headers,
    );
    if (brandingId) {
      await gqlRequest(deleteBrandingMutationText, { id: brandingId }, headers);
    }
  }
});

test('masonry branding renders fixed columns and preserves tile navigation', async ({
  page,
}) => {
  const headers = await adminAuthHeader();
  let brandingId: string | undefined;
  const failures = trackBrowserFailures(page);

  try {
    const created = await gqlRequest<{ editBranding?: { id: string } }>(
      editBrandingMutationText,
      {
        name: 'Masonry Gallery Test',
        galleryLayout: 'masonry',
        thumbnailSize: defaultRowHeight,
        thumbnailSpacing: defaultMargin,
      },
      headers,
    );
    expect(created.errors).toBeUndefined();
    brandingId = created.data?.editBranding?.id;
    expect(brandingId).toBeTruthy();

    const assigned = await gqlRequest(
      setFolderBrandingMutationText,
      { folderId: photoFolderId, brandingId },
      headers,
    );
    expect(assigned.errors).toBeUndefined();

    await useGalleryView(page);
    await login(page);
    await openFolder(page, photoFolderId);

    const gallery = page.locator('#ReactGridGallery');
    const tiles = gallery.locator(tileSelector);
    await expect(gallery).toBeVisible();
    await expect(tiles).toHaveCount(10);
    await waitForGalleryImages(page, gallery, 10);
    await setGalleryWidth(page, gallery, 1200);

    const columns = gallery.locator('.ReactGridGallery_masonry-column');
    await expect(columns).toHaveCount(5);
    const boxes = await tileBoxes(gallery);
    expect(new Set(boxes.map((box) => Math.round(box.width))).size).toBe(1);
    expect(
      new Set(boxes.map((box) => Math.round(box.height))).size,
    ).toBeGreaterThan(1);

    // Masonry redistributes tiles into column DOM order. Clicking a tile from
    // the end of that redistributed order must still open that tile's href,
    // proving the package's originalIndex reaches PICR's click handler.
    const redistributedTile = gallery.locator(`a${viewportSelector}`).last();
    const href = await redistributedTile.getAttribute('href');
    expect(href).not.toBeNull();
    await redistributedTile.click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegExp(href ?? '')}$`));
    await expect(page.locator('.yarl__container')).toBeVisible();

    expectNoBrowserFailures(failures);
  } finally {
    await gqlRequest(
      setFolderBrandingMutationText,
      { folderId: photoFolderId, brandingId: null },
      headers,
    );
    if (brandingId) {
      await gqlRequest(deleteBrandingMutationText, { id: brandingId }, headers);
    }
  }
});

async function useGalleryView(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('SelectedView', JSON.stringify('gallery'));
  });
}

async function login(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Username').fill(defaultCredentials.username);
  await page
    .getByRole('textbox', { name: 'Password' })
    .fill(defaultCredentials.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('**/admin', { timeout: 15_000 });
  await expectDashboardReady(page);
  await page.waitForLoadState('networkidle');
}

async function openFolder(page: Page, folderId: string) {
  await page.goto(`/admin/f/${folderId}`, { waitUntil: 'domcontentloaded' });
}

async function waitForGalleryImages(
  page: Page,
  gallery: Locator,
  count: number,
) {
  const images = gallery.locator('img');
  await expect(images).toHaveCount(count);
  await expect
    .poll(() =>
      images.evaluateAll((elements) =>
        elements.every(
          (element) =>
            element instanceof HTMLImageElement &&
            element.complete &&
            element.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function setGalleryWidth(
  page: Page,
  gallery: Locator,
  containerWidth: number,
) {
  await gallery.evaluate((element, width) => {
    const galleryElement = element as HTMLElement;
    galleryElement.style.width = `${width}px`;
    galleryElement.style.marginInline = 'auto';
  }, containerWidth);
  await expect
    .poll(async () => Math.round((await gallery.boundingBox())?.width ?? 0))
    .toBe(containerWidth);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
  );
}

type TileBox = {
  left: number;
  right: number;
  top: number;
  width: number;
  height: number;
};

async function tileBoxes(gallery: Locator): Promise<TileBox[]> {
  return gallery.locator(tileSelector).evaluateAll((elements) =>
    elements.map((element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        width: box.width,
        height: box.height,
      };
    }),
  );
}

async function expectGalleryRows(
  gallery: Locator,
  containerWidth: number,
  {
    underfilledFinalRow,
    rowHeight,
    margin,
  }: { underfilledFinalRow: boolean; rowHeight: number; margin: number },
) {
  const boxes = await tileBoxes(gallery);
  const galleryBox = await gallery.boundingBox();
  expect(galleryBox).not.toBeNull();

  const rows = new Map<number, TileBox[]>();
  for (const box of boxes) {
    const rowTop = Math.round(box.top);
    rows.set(rowTop, [...(rows.get(rowTop) ?? []), box]);
  }
  const orderedRows = [...rows.values()];
  expect(orderedRows.length).toBeGreaterThan(1);

  // buildLayout fills `containerWidth - row.length * 2 * margin` with scaled
  // tiles, and each tile then carries a CSS `margin` on every side. A bounding
  // box is the border box, so a fully justified row ends exactly `margin`
  // short of the container edge — not at it.
  const justifiedRight = (galleryBox?.x ?? 0) + containerWidth - margin;

  const finalRow = orderedRows.at(-1);
  expect(finalRow).toBeDefined();
  const finalRight = Math.max(...(finalRow ?? []).map((box) => box.right));
  if (underfilledFinalRow) {
    expect(justifiedRight - finalRight).toBeGreaterThan(8);
  } else {
    expect(Math.abs(justifiedRight - finalRight)).toBeLessThanOrEqual(5);
  }

  const justifiedRows = orderedRows.slice(0, -1);
  expect(justifiedRows.length).toBeGreaterThan(0);
  for (const row of justifiedRows) {
    const rowRight = Math.max(...row.map((box) => box.right));
    expect(Math.abs(justifiedRight - rowRight)).toBeLessThanOrEqual(5);
  }

  // At least one row overflowed and had to be scaled below the target height.
  expect(
    justifiedRows.some((row) => row.some((box) => box.height < rowHeight)),
  ).toBe(true);
}

async function expectFolderTileAspect(gallery: Locator) {
  // Folder items are built as `width: thumbnailSize * 2, height: thumbnailSize`,
  // so every folder tile stays twice as wide as it is tall after scaling.
  const boxes = await tileBoxes(gallery);
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.width / box.height).toBeCloseTo(2, 1);
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
