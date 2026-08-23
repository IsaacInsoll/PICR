# Tests Guide

Testing is split into two suites under `tests/`:

- `tests/api/`: backend API integration tests (Vitest + Docker)
- `tests/e2e/`: basic frontend browser smoke tests (Playwright + Docker)

## Scope

- API tests validate GraphQL/backend behavior against the Dockerized backend.
- E2E tests validate that key frontend routes load in a browser and do not throw console errors.
- Keep these suites integration-focused; do not add frontend component unit tests here.
- Exception: pure backend or shared-primitive unit tests that guard load-bearing
  invariants (e.g. file queue ordering/coalescing or shared i18n catalog
  contracts) are allowed in `tests/api`. They mock their dependencies and need
  no Docker/DB. Name them `*.unit.test.ts` and see "Fast Docker-free unit lane"
  below.

## Fast Docker-free Unit Lane

`npm run test:api` runs `vitest run` against `vite.config.mts`, whose `globalSetup`
unconditionally builds and starts the Docker test container — even when you target
a single file (`npx vitest run tests/api/foo.test.ts` still pays the buildout).

For pure unit tests that mock their dependencies, use the Docker-free lane instead:

- `npm run test:unit` runs `vitest run --config vitest.unit.config.mts`, which has
  **no** `globalSetup`, so no container is built or started (~0.5s vs the full
  Docker cycle). Use this for fast local iteration on primitives.
- It only picks up files matching `tests/**/*.unit.test.*`. Name Docker-free unit
  tests `*.unit.test.ts`.
- These files are ALSO matched by `vite.config.mts`, so they still run under
  `npm run test:api` in CI — the unit lane is a faster local lens, not a way to
  skip CI coverage.
- Do NOT put anything needing the DB, real GraphQL, or media fixtures behind this
  lane; those belong in the numbered integration tests.

## GraphQL Reuse Rules

- For `tests/api`, do not write inline GraphQL strings for app behavior.
- In `tests/api`, import shared operations from `shared/urql/queries/*` and `shared/urql/mutations/*` so tests validate real client documents.
- In `tests/e2e`, keep browser-smoke GraphQL operations local to `tests/e2e/` (for example `tests/e2e/mutations.ts`) to avoid Playwright TypeScript loader issues with generated GraphQL enum files.
- Reuse existing GraphQL test helpers where compatible with the runner.
- In `tests/e2e` Playwright tests, avoid importing enums from generated GraphQL type files (for example `shared/gql/graphql`) because Playwright TS loading can fail on enums.
- For GraphQL enum inputs in Playwright tests, pass the enum literal string value (for example `'Read'`) instead.

## Directory Layout

```text
tests/
├── AGENTS.md
├── api/
│   ├── compose.yml
│   ├── env/
│   │   └── media/        # committed test fixtures (photos + video)
│   ├── testEnvironment.ts
│   ├── testSetup.ts
│   ├── testVariables.ts
│   └── *.test.ts
└── e2e/
    ├── playwright.config.ts
    ├── globalSetup.ts
    ├── globalTeardown.ts
    ├── *.smoke.spec.ts
    ├── *.visual.spec.ts
    └── *.visual.spec.ts-snapshots/
```

## Commands

- `npm run test:api`: run backend API Vitest suite (Docker)
- `npm run test:unit`: run Docker-free backend unit tests (`*.unit.test.ts`), fast local iteration
- `npm run test:e2e:install`: install Playwright browser binaries without trying
  to modify system packages. This is the portable local command, including on
  Arch/Manjaro where Playwright's Ubuntu `apt-get` fallback cannot work.
- `npm run test:e2e:install:ci`: install Playwright browsers and Ubuntu system
  dependencies. This is for the Ubuntu GitHub Actions runner, not local use.
- `npm run test:e2e`: run the frontend Playwright browser suite
- `npm run test:e2e:fresh`: rebuild local `dist` artifacts, then run the frontend Playwright browser suite
- `npm run test`: run both suites in order (`api` then `e2e`)

## Gallery Visual Baselines

- `tests/e2e/gallery.visual.spec.ts` exercises the real authenticated PICR
  gallery against the committed media fixtures. It controls the
  `#ReactGridGallery` width independently of the browser viewport so row-layout
  regressions are reproducible.
- Playwright and Chromium are pinned through the exact root
  `@playwright/test` version and lockfile. Keep the visual tests on Chromium,
  light colour scheme, device scale factor 1, and the configured locale/timezone.
- These inherited baselines were generated while the vendored gallery was
  active. Keep running package replacements against those same files; do not
  update snapshots to make a migration pass without review and an explanation
  of every visual difference.
- Visual baselines are Linux PNGs under
  `tests/e2e/gallery.visual.spec.ts-snapshots/` and are committed. They are
  generated on a developer machine but also compared on the Ubuntu CI runner,
  which shares the `-linux` platform suffix. The folder-tile baselines are the
  only ones containing rendered text and a `backdrop-filter` blur, so they are
  the most likely to drift between distributions.

### Covered Tile Shapes

Each tile shape PICR builds in `GridGallery.tsx` needs its own page, because
one folder only produces one shape:

- Image tiles (`/admin/f/3`, `Dog Photos`): justified rows, an overflowing row
  that rescales, an underfilled final row, and the `<a href>` tile branch.
- Folder tiles (`/admin/f/1`, root): `thumbnailSize * 2` by `thumbnailSize`
  tiles with an empty `src` and a `PicrFolder` thumbnail drawn as a CSS
  background, plus folder-to-folder navigation.
- Video tiles (`/admin/f/2`, `Birthday Video`): the no-`href` branch, where the
  tile viewport stays a `<div>`.
- Custom branding: `thumbnailSize`/`thumbnailSpacing`/`thumbnailBorderRadius`
  away from their defaults, since `thumbnailSpacing` feeds both row fitting in
  `buildLayout` and the tile's own CSS margin.
- Masonry branding: fixed-width columns with varied natural image heights, plus
  a redistributed tile click that proves `originalIndex` still opens the file
  represented by the clicked link.

Deliberately not covered, because `GridGallery.tsx` never enables them:
image selection (`enableImageSelection={false}`), `isSelected`, `tags`,
`customOverlay`, `maxRows`, `thumbnailStyle`, `tagStyle`, and `onSelect`. The
hover `tile-overlay` also only renders when selection is enabled, so tile
appearance does not depend on pointer position. Generic (non image/video) file
tiles are not covered either — no fixture produces one.

### Gotchas When Adding Scenarios

- A justified row ends exactly `margin` short of the container's right edge:
  `buildLayout` fills `containerWidth - row.length * 2 * margin`, then each
  tile adds a CSS `margin` that a bounding box excludes. Assertions that ignore
  this only pass because the default spacing of 4 is inside their tolerance.
- In browser smoke tests, `page.waitForURL('**/admin')` only proves the route
  navigation happened. The lazy dashboard and its `useMe()` read can still be
  catching up before section headings render, especially on CI. Use
  `expectDashboardReady()` instead of a bare default-timeout text assertion for
  dashboard readiness.
- `PicrVideoPreview` advances its scrub frame on a 1s `setInterval`, so any
  video screenshot needs `page.clock.install()` before navigating.
- Branding scenarios must create a branding, assign it with
  `setFolderBranding`, and unwind both in a `finally`. Specs share one database
  within a run (`workers: 1`, no per-spec reset), so a leaked branding changes
  later specs.

## Local Build Requirement For E2E

- Local Playwright runs start Docker from prebuilt `dist` outputs.
- This means local `npm run test:e2e` can miss recent `frontend/src` changes if `dist` is stale.
- For meaningful frontend runtime validation, run a fresh local build first.
- Preferred command: `npm run test:e2e:fresh`.

## Local Build Requirement For API Tests

- `npm run test:api` ALSO runs against a Docker image built from `dist` (the
  compose file's `build: ../..` uses the Dockerfile, which `COPY`s `./dist`).
- So after changing `backend/**` or `shared/**` (resolvers, GraphQL schema/args,
  shared queries), a stale `dist` means the suite tests the OLD schema — it can
  pass without exercising your change, or fail with "Unknown argument" if a
  shared query uses a new arg the built image doesn't have.
- There is no `test:api:fresh`. Rebuild first, e.g.
  `npm run build:local && npm run test:api`.

## CI Expectations

- CI runs `test:api` and `test:e2e` separately.
- `tests/api` and `tests/e2e` each bootstrap their own Docker test environment via `tests/api/testEnvironment.ts`.
- The current seed-media readiness probe returns after it sees any image and any
  video; it does not wait for the entire initial scan. A full API run can
  therefore occasionally observe fewer than the 10 committed Dog Photos even
  though all fixtures are mounted. Treat that exact mismatch as startup-race
  evidence rather than changing the fixture assertion; make the readiness probe
  wait for the complete fixture set when addressing the test harness.
- For short localized form labels that prefix-match another label (for example
  French `Nom` and `Nom de l'entreprise`), prefer
  `getByRole('textbox', { name: 'Nom', exact: true })`. Mantine required labels
  include a visual asterisk in their label text, so an exact `getByLabel`
  locator may not match even when the textbox's accessible role name is exact.

## Test Media Fixtures

- Photo and video fixtures are committed at `tests/api/env/media/` and bind-mounted into the test container by `tests/api/compose.yml`.
- `testEnvironment.ts` does not download anything; if `env/media/` is missing it throws. Run `git status` / `git restore` to recover.
- Photos (`Dog Photos/`) are deliberately re-encoded at low JPEG quality to keep the repo small while preserving filenames, dimensions, and EXIF — test assertions depend on the original filenames (e.g. `XH2A2139.jpg`) and blurhash output, not visual fidelity.
- The video (`Birthday Video/Jess Birthday.mp4`) is a compressed re-encode of the original; `08-video-processing.test.ts` asserts the codec/dimensions/duration of the file currently in the tree. If you re-encode it, update those ranges.
- Do not run the full benchmark workload from the API suite. It is intentionally manual/admin-triggered and can exceed normal test timeouts; API tests should only cover auth/schema behavior for benchmark entry points.
