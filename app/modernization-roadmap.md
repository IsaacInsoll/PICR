# PICR App Modernization Roadmap

This is the living tracker for modernizing the PICR Expo app. The app is a
side project relative to core PICR, so the work is intentionally split into
small phases that can be picked up and put down without leaving the repository
in an ambiguous state.

Last reviewed: 2026-09-02

## Current status

Phase 1 implementation is complete on the SDK 55 baseline. On 2026-08-25, a
cleanly regenerated Android development build compiled and launched in an
emulator; login, dashboard, folder browsing, full-screen image display and
carousel navigation were manually exercised. Runtime problems found during that
smoke pass were fixed and rechecked. No EAS build or store release was used.

Phase 2's unit/component safety net is complete. The Jest/React Native Testing
Library suite currently passes 103 tests across login, URL normalization, auth
expiry, SecureStore migration, route construction, date formatting, branding,
presentation defaults, photographer file actions, native row identifiers and
notification settings. It runs from root checks, CI and app release preflight,
and the root workflow passed after these changes on 2026-08-25. Independent
local Maestro flows are scaffolded for navigation, image download, video
playback, comment creation and notification settings. Full native execution is
deliberately deferred and is not blocking the next phase.

The remaining Phase 1 exit gates are platform/feature coverage rather than
known implementation failures: an iOS development build, physical-device
coverage, and explicit manual checks for video playback, comment interaction,
downloads and notification settings. These can be folded into the Phase 2
automated safety-net work rather than spending a cloud build only to close the
checklist.

Phase 3 contract cleanup is in progress. The native public-link route/provider
has been removed, authenticated notification routes are allowlisted, and client
gallery deep links now fall back to the browser. Login failures now use the
app's typed local outcomes rather than English message matching without changing
the backend API. The app now targets the current server GraphQL contract and
uses its published thumbnail-variant tokens for native image and video-poster
requests. Its authenticated-user query and app-only view model no longer request
or expose public-link user fields. One authenticated server-origin contract now
owns GraphQL headers, media URLs, native route keys and base-path-aware incoming
links; legacy server-schema negotiation is deliberately out of scope while the
app has no external user base. Download failures now give the photographer
useful feedback, and opening Notification Settings checks local permission
without prompting; permission is requested only after explicit opt-in. The
native route tree and every advertised link target have been audited, and
incoming authenticated URLs now match only implemented native route shapes.
The only remaining Phase 3 implementation decision is whether the app should
continue retaining the password for startup re-authentication. Closing the
phase also requires a fresh-default-server `admin` login, HTTPS media/download
smoke coverage and native Maestro execution; shared login-error metadata remains
separately approved core API work rather than an app-modernization blocker. Expo
SDK upgrades remain deliberately separate.

## Product direction

For the medium term, the native app is a **photographer/admin companion** for a
self-hosted PICR server.

- Authenticated photographers can browse their server, review media, comment,
  download originals, receive notifications and use appropriate admin-oriented
  tools.
- Client/public-link galleries remain a web-frontend responsibility.
- Native public-link support can be reconsidered if there is demonstrated
  demand. It should then be implemented as a complete product surface rather
  than restored piecemeal.
- Web-browser support from the Expo app is not currently a product goal; PICR's
  existing frontend owns the browser experience. Confirm this before removing
  the app's `web` script and web-only dependencies.

## Working rules

- Keep each phase independently reviewable and reversible.
- Do not combine an Expo SDK upgrade, workspace migration and user-facing
  feature work in one change.
- Add characterization tests before changing routing, authentication, storage,
  package resolution or shared-code ownership.
- For dependency upgrades, use Expo's expected versions rather than installing
  the registry's unconstrained `latest` versions.
- Upgrade Expo one SDK at a time: SDK 55 → 56, verify, then 56 → 57 and verify.
- A workspace migration is complete only when a clean checkout works. Success
  with pre-existing `node_modules` directories is not sufficient evidence.
- Before every commit, follow the root `AGENTS.md` checks for each touched
  subsystem. Ask the user to run `npm run workflow` before pushing completed
  work.

## Build and release budget

The app uses Expo's free plan, so EAS cloud builds are a limited project
resource. The default workflow is local-first:

- Ship no more than one coordinated production release per calendar week. A
  release may include both stores, but should batch a meaningful set of already
  validated changes.
- Do not publish a store release merely to validate a roadmap phase or an
  individual fix.
- Use lint, typecheck, unit/component tests, Expo Doctor, Expo exports, Metro,
  emulators/simulators and locally compiled development builds for routine
  iteration. These checks should be exhausted before spending an EAS build.
- Run Maestro and manual smoke tests against a local development build whenever
  the native dependency set permits it.
- Reserve EAS cloud builds for changes that genuinely require Expo's remote
  native environment, a phase-ending production-like candidate, or the weekly
  release candidate. Record the build's purpose before starting it.
- Batch native dependency and configuration changes so one candidate can test
  several completed items. Never batch unrelated changes merely to meet a
  calendar deadline.
- Check the remaining monthly EAS allowance before scheduling a candidate. Keep
  enough capacity for a necessary rebuild caused by signing, native compilation
  or store-submission failure.
- A failed local test blocks the EAS build. A successful EAS build does not
  replace the local and CI checks.

## Baseline observed on 2026-08-25

- [x] `cd app && npm run lint` passes.
- [x] `cd app && npm run typecheck` passes.
- [x] `cd app && npx expo export --platform android` passes.
- [x] `cd app && npx expo export --platform ios` passes.
- [x] Repo-wide `npm run format:check` passes.
- [x] Expo Doctor passes 20/20 checks after applying the current SDK 55 patches.
- [ ] `npm audit` is clean. Production dependencies retain 11 moderate
      advisories in Expo's build/configuration toolchain; the full audit adds
      one path through `jest-expo`. npm's proposed force-fix crosses an Expo SDK
      boundary, so the remainder is deferred to the planned SDK 56/57 upgrades.
- [x] App unit/component tests exist and pass locally (103 tests on 2026-09-02).
      Native Maestro execution is scaffolded and deliberately deferred.
- [ ] Package/store versions are reconciled. `app/package.json` is 1.0.6, while
      the public store listings observed during the audit show older releases.

## Phase 1: Stabilize the current SDK 55 baseline

Goal: remove known patch drift and make the existing release gates trustworthy
before larger changes.

- [x] Update Expo-managed packages to the versions expected by SDK 55 with
      `npx expo install --fix`.
- [x] Review the package and lockfile diff; avoid unrelated dependency churn.
- [x] Run `npm ci` in `shared` and `app` after the lockfile update.
- [x] Run Expo Doctor and resolve all actionable failures.
- [x] Make Expo Doctor blocking in CI and `release:app:preflight` instead of
      swallowing its exit code.
- [x] Add both Android and iOS Expo exports to CI and release preflight.
- [x] Run `npm audit` again and resolve or explicitly document remaining
      advisories.
- [x] Remove imports from unsupported internal paths such as
      `expo-router/build/*`, React Native `Libraries/*`, and package `src/*`
      paths.
- [x] Force-install `Intl.RelativeTimeFormat` for Hermes, verify all bundled
      locale data in CI/release preflight, and keep a tested absolute-date
      fallback for absent or partially loaded implementations.
- [x] Keep app-owned Jotai state on the app package instance until workspace
      dependency deduplication is complete.
- [x] Replace the feed's last third-party `CachedImage` component with
      `expo-image`, preserving blurhash placeholders and memory/disk caching.
- [x] Update `@gorhom/bottom-sheet` past the New Architecture
      `unstable_getBoundingClientRect` crash; retain the current v5 component
      unless a later UX review justifies a migration.
- [x] Correct the full-screen carousel's asymmetric slide translation and
      stacking so adjacent-item dimming does not leak through the transparent
      header and image letterboxing.
- [x] Record reproducible Android and iOS development-build instructions.

Exit gate:

- [x] Lint, typecheck, Expo Doctor and both platform exports pass.
- [x] A cleanly regenerated SDK 55 Android project passes
      `app:assembleDebug` locally.
- [x] A locally compiled Android development build launches in an emulator.
- [x] Login, dashboard, folder browsing, full-screen image display and carousel
      navigation pass the Android emulator smoke test.
- [ ] A locally compiled development build launches on a physical Android
      device and an iOS simulator/device where the available host supports it.
      Use an EAS development build only when the remote native environment is
      genuinely required.
- [ ] Video playback, comment interaction, downloads and notification settings
      have been explicitly smoke-tested.

## Phase 2: Add the app safety net

Goal: protect current behavior before routing, auth and monorepo work.

### Unit and component tests

- [x] Add `jest-expo`, Jest and React Native Testing Library using Expo-compatible
      versions.
- [x] Add an app test script and run it from root checks/CI and release
      preflight.
- [x] Test server URL normalization, including HTTPS, plain HTTP, ports and base
      paths where supported.
- [x] Test that a plain username such as the default `admin` is valid.
- [x] Characterize login success, invalid credentials and unreachable-server
      behavior, including the compatibility fallback for older servers that
      return an empty auth token.
- [x] Test that the structured expired-auth callback clears both in-memory and
      persisted authentication.
- [x] Test SecureStore payload validation and migration from the existing
      unversioned JSON shape.
- [x] Test authenticated route construction and notification deep-link parsing.
- [x] Test download and comment action visibility for the intended admin user,
      including the permitted media-library save path.
- [x] Test branding defaults plus sort/view preference resolution.

### Native smoke tests

- [x] Add stable accessibility labels/test IDs to the critical flow.
- [x] Configure the existing Maestro/EAS development-build profile to select
      the separately installable `.dev` app variant.
- [x] Add a Maestro flow for login → dashboard → folder → image → actions →
      back. Full native execution is deliberately deferred.
- [x] Add image download and video playback smoke flows.
- [x] Add comment creation and notification-settings smoke flows, with an
      explicit emulator fallback when push tokens are unavailable.
- [x] Document native E2E as local by default. Consider EAS Workflows only if its
      additional coverage justifies the free-plan usage.

Exit gate:

- [ ] The critical photographer workflow has verified native automated coverage.
      The harness exists, but execution is deferred by maintainer choice.
- [ ] Tests fail when a known route, login or server-origin contract is
      deliberately broken.

## Phase 3: Enforce the photographer/admin boundary and fix contracts

Goal: remove incomplete public-link behavior and align the app with current
backend/shared contracts.

- [x] Remove native public-link routes, `PicrPublicUserProvider`, public UUID
      routing branches and public-link-only atoms/helpers.
- [x] Remove generation of public file URLs that have no matching route.
- [x] Ensure external client gallery links open in the system browser/frontend,
      not an incomplete native route.
- [x] Limit notification deep links to authenticated app routes; define browser
      fallback behavior for public-link notifications if any exist.
- [x] Replace `z.string().email()` username validation with the backend's
      non-empty username contract. Completed early in Phase 2 so the default
      `admin` account could be covered by the login tests.
- [x] Replace app login error-message string matching with typed local outcomes.
      Empty-token authentication rejection, transport failure and unexpected
      server failure are distinct without changing the backend API contract.
- [ ] Introduce shared structured login error metadata only as separately
      approved core PICR API work. It is not part of routine app modernization.
- [x] Introduce a typed, versioned SecureStore schema and validate parsed data.
      Completed early in Phase 2 to make the persistence characterization safe.
- [ ] Decide whether storing the password remains necessary after initial login;
      prefer token refresh/re-auth flows that minimize retained credentials.
- [x] Use one authenticated server-origin context for GraphQL, images, videos,
      downloads and links.
- [x] Preserve plain-HTTP URLs on a best-effort basis without silently upgrading
      them. HTTPS is the supported default; native cleartext-policy work and
      physical-device HTTP coverage are not release gates unless demand emerges.
- [x] Show useful download failures instead of silently swallowing errors.
- [x] Check local notification permission without requesting it merely because
      Settings was opened.
- [x] Remove dead public-user fields and branches from app-only view models where
      they no longer serve the photographer product.

Exit gate:

- [x] The route tree contains no advertised but unmatched native route.
- [ ] A fresh default PICR installation can log in as `admin`.
- [ ] Authenticated media and downloads work against HTTPS. Plain HTTP retains
      contract-test coverage but does not block the phase or a release.
- [ ] Contract tests and Maestro smoke tests pass.

## Phase 4: Upgrade Expo SDK 55 → 56

Goal: make one attributable framework upgrade.

- [ ] Read the SDK 56 release notes and every used Expo module's relevant
      changelog.
- [ ] Upgrade Expo to SDK 56 and run `npx expo install --fix`.
- [ ] Raise the iOS deployment target from 16.0 to the SDK 56 minimum of 16.4.
- [ ] Confirm the available local/EAS Xcode image satisfies SDK 56 requirements.
- [ ] Reassess `@rnrepo/expo-config-plugin`; measure whether SDK 56 build
      improvements make it unnecessary.
- [ ] Review all native community libraries for React Native 0.85/New
      Architecture compatibility.
- [ ] Rebuild development clients locally where possible; an old development
      client is not valid upgrade evidence. SDK 56 is an intermediate validation
      point, not a store release.

Exit gate:

- [ ] Clean install, lint, typecheck, tests, Expo Doctor and both exports pass.
- [ ] Android and iOS development builds pass the real-device smoke checklist.
- [ ] No unresolved warning is hidden by a release script.

## Phase 5: Upgrade Expo SDK 56 → 57

Goal: reach the current stable Expo SDK and React Native 0.86.

- [ ] Read the SDK 57 and React Native 0.86 release notes.
- [ ] Upgrade Expo to SDK 57 and run `npx expo install --fix`.
- [ ] Review the SDK 57 Hermes/Reanimated memory regression and its current fix
      or recommended configuration before enabling worklets bundle mode.
- [ ] Re-evaluate image caching: SDK 57 adds additional `expo-image` cache APIs
      that may replace the legacy third-party cache.
- [ ] Rebuild development clients locally. Request a production-like EAS preview
      only after all cheaper SDK 57 exit gates pass and it can serve as the next
      batched candidate.

Exit gate:

- [ ] Clean install, lint, typecheck, tests, Expo Doctor and both exports pass.
- [ ] Android and iOS preview builds pass the full smoke checklist.
- [ ] Bundle size and startup/memory measurements are recorded for comparison
      with the SDK 55 baseline.

## Phase 6: Convert the repository to real workspaces safely

Goal: make `shared`, app, frontend and eventually backend participate in an
explicit package graph without reintroducing duplicate React/native modules or
breaking the standalone backend artifact.

This phase must be isolated from feature work. Do not add Turborepo merely to
make the repository qualify as a monorepo; npm workspaces and correct package
boundaries come first. A task runner can be considered later if measured build
times justify caching.

### Characterize before changing installs

- [ ] Capture `npm ls`/`npm explain` output for React, React Native, Jotai, URQL,
      Graphcache and every native module shared across packages.
- [ ] Record resolved real paths for React, Jotai and URQL from app, frontend and
      shared. The current separate installs resolve distinct copies.
- [ ] Confirm the existing clean-install, build, test and export baseline in CI.
- [ ] Add a guard that detects duplicate React and duplicate native modules in
      the app dependency graph.
- [ ] Inventory scripts, Docker build steps, EAS behavior and Dependabot entries
      that assume independent package lockfiles.

### Correct package ownership first

- [ ] Move the browser-specific shared `useRequery` hook to the frontend or put
      browser/native visibility behind consumer-owned adapters.
- [ ] Keep shared operations, contracts and pure functions platform-neutral.
- [ ] Audit shared Jotai atoms and URQL helpers for runtime package-instance
      assumptions.
- [ ] Align app and frontend React/Jotai/URQL ranges to versions that can be
      safely deduplicated while respecting Expo's exact React requirement.
- [ ] Rename/formalize the shared package as `@picr/shared` and declare it as an
      explicit dependency of every consumer.
- [ ] Define intentional exports instead of relying on filesystem-wide aliases.

### Introduce workspaces

- [ ] Mark the root package private and pin the package manager version.
- [ ] Add npm workspace declarations.
- [ ] Produce one authoritative workspace lockfile and remove redundant client
      lockfiles only after clean-install validation.
- [ ] Replace root `npm --prefix`/`cd` orchestration with workspace-aware scripts
      where it improves clarity.
- [ ] Verify EAS installs the workspace from the app directory as expected.
- [ ] Remove manual Metro `watchFolders` and `extraNodeModules` configuration
      only after Expo's automatic workspace support passes clean-start testing.
- [ ] Start Expo once with a cleared Metro cache after changing resolution.
- [ ] Consolidate Dependabot entries to match the new lockfile ownership.

### Preserve the backend release artifact

- [ ] Decide whether backend joins the first workspace migration or remains an
      explicitly documented standalone package temporarily.
- [ ] If backend joins, design a reproducible way to generate the standalone
      `dist/package.json` and `dist/package-lock.json` used by Docker.
- [ ] Prove `npm ci --omit=dev` in a clean `dist/` installs only backend runtime
      dependencies.
- [ ] Run backend build, API tests and the Dockerized runtime path before calling
      the workspace migration complete.

Workspace exit gate:

- [ ] A clean checkout with no subsystem `node_modules` installs successfully
      using the documented root command.
- [ ] Duplicate React/native-module guard passes.
- [ ] Shared, backend, frontend and app lint/type checks pass.
- [ ] Backend and frontend production builds pass.
- [ ] API tests and frontend E2E tests pass.
- [ ] Android and iOS Expo exports pass.
- [ ] Android and iOS development builds pass the real-device smoke checklist.
- [ ] Docker still installs from a reproducible standalone production lockfile.
- [ ] The user runs `npm run workflow` before the workspace change is pushed.

## Phase 7: Port current PICR presentation contracts

Goal: bring the photographer app up to date with current shared/frontend product
behavior without copying web component implementations.

- [ ] Create a native branding model from shared defaults rather than reading
      isolated GraphQL fields ad hoc.
- [ ] Apply theme mode and primary colour throughout native navigation and UI.
- [ ] Apply heading font, size and alignment consistently.
- [ ] Render folder banners with their size and text-position fields.
- [ ] Apply gallery layout, thumbnail size, spacing and border radius.
- [ ] Support branding default sort and the current folders-first behavior.
- [ ] Persist the photographer's sort and view preferences locally.
- [ ] Render branding footer title, URL and social links where appropriate.
- [ ] Use the shared root-folder display-name contract without changing stored
      folder names.
- [ ] Bring current metadata formatting and unavailable-date behavior to native.
- [ ] Review dashboard scanning/task/server information added to the frontend and
      choose native-appropriate equivalents.
- [ ] Review current image/video lightbox behavior and port only behavior that is
      relevant to a native viewer.

Exit gate:

- [ ] A representative branded gallery has an agreed screenshot comparison on
      frontend, Android and iOS.
- [ ] Shared contract tests cover branding/sort fallback behavior.
- [ ] Native smoke tests cover the supported presentation variants.

## Phase 8: Native quality, localization and performance

Goal: make the app feel intentionally native and maintainable.

### Localization

- [ ] Add the app to the existing i18n extraction inputs and catalog contracts.
- [ ] Use the existing English, French and Greek catalogs where keys are shared.
- [ ] Add app-specific catalog keys only for genuinely native UI.
- [ ] Separate catalog language from regional formatting locale.
- [ ] Verify font fallback for Greek headings and user content.
- [ ] Update store localization metadata when another app language ships.

### Accessibility and native UX

- [ ] Add labels, hints, roles and states to every icon-only or custom control.
- [ ] Verify VoiceOver and TalkBack critical flows.
- [ ] Verify large text, reduced motion, contrast, dark mode and orientation.
- [ ] Review tablet layouts and safe-area behavior.
- [ ] Replace raw alerts and silent catches with consistent native feedback.

### Dependencies and bundle

- [ ] Remove direct dependencies with no app/config/build use after verifying
      they are not required peers.
- [ ] Explicitly declare every package imported by app source rather than relying
      on transitive installation.
- [ ] Consolidate `@georstat/react-native-image-cache` and `expo-image` into one
      supported caching/download model if SDK 57 APIs cover the requirements.
- [ ] Import only the icon families used by the app and remeasure bundled fonts.
- [ ] Review whether every branding font must ship in every binary or can be
      delivered/loaded more selectively.
- [ ] Record Android/iOS binary, JS bundle, asset, startup and memory sizes.

Exit gate:

- [ ] No critical-flow accessibility issue remains.
- [ ] i18n extraction and catalog contract checks include app source.
- [ ] Dependency list has a documented owner/use for every exceptional native
      package or override.
- [ ] Bundle and runtime measurements do not regress without an accepted reason.

## Phase 9: Release rehearsal and rollout

- [ ] Select the weekly release window and list the completed changes included
      in this candidate. Defer nonessential late additions to the next window.
- [ ] Check the remaining EAS allowance and reserve capacity for one necessary
      rebuild before starting cloud builds.
- [ ] Reconcile `app/package.json`, EAS remote build versions and both store
      listings.
- [ ] Confirm production EAS environment variables and the Android Google
      services file configuration.
- [ ] Run `npm run release:app:dry` with Doctor now acting as a blocking gate.
- [ ] Build one batched internal Android/iOS production-like candidate after all
      local and CI gates pass.
- [ ] Run automated and manual smoke tests against a clean current PICR server.
- [ ] Test upgrade from the currently published store binaries where practical.
- [ ] Update store descriptions, screenshots, release notes, supported languages,
      minimum OS versions, accessibility declarations and privacy/data-safety
      answers.
- [ ] Release through TestFlight/Play internal testing before production.
- [ ] Use staged rollout where supported and monitor store/EAS crash reports.
- [ ] Publish no more than one coordinated production release in the calendar
      week; do not release only because a weekly slot exists.
- [ ] Document the next supported server/app compatibility expectation.

## Deferred ideas

These are intentionally not prerequisites for the modernization release:

- Native public/client-link gallery support.
- EAS Update/over-the-air JavaScript delivery.
- Turborepo or another task-graph/cache layer.
- Full frontend administration/settings parity.
- Product analytics. Adding analytics would require a deliberate privacy and
  store-disclosure decision.

## Completion definition

The modernization project is complete when:

- [ ] The app is an explicit, tested photographer/admin product with no partial
      public-client surface.
- [ ] It runs on Expo SDK 57 and passes Expo Doctor.
- [ ] Critical behavior is protected by unit/component and native smoke tests.
- [ ] Workspace installation is reproducible from a clean checkout without
      duplicate React/native modules.
- [ ] Current shared branding, formatting and auth contracts are honored.
- [ ] Accessibility, localization, dependency and bundle reviews are complete.
- [ ] Android and iOS store releases have passed an internal rollout.
