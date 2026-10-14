# Testing

## Current test procedure

> Pro Tip: run a fresh local build before E2E smoke tests so Docker uses current artifacts.

Testing now has two integration suites:

- `tests/api`: backend API coverage (Vitest + Docker)
- `tests/e2e`: basic frontend smoke coverage (Playwright + Docker)

There is also a fast unit lane for pure backend primitives:

- `tests/**/*.unit.test.ts`: Docker-free Vitest unit tests for isolated logic

Run everything with `npm run test`, or run suites individually:

- `npm run test:unit`
- `npm run test:api`
- `npm run test:e2e:install` (browser binaries)
- `npm run test:e2e`
- `npm run test:e2e:fresh` (recommended for frontend changes: rebuild + e2e)

`npm run test:unit`:

- Uses `vitest.unit.config.mts`
- Does not run `tests/api/testSetup.ts`
- Does not build or start Docker
- Only picks up `*.unit.test.ts`
- Is for fast iteration only: those same unit tests still run during `npm run test:api`

`npm run test:api`:

- Builds docker image from existing `dist` folder
- Download example files (if not already downloaded) and extract into `/media` folder
- Start `test-picr` container on port `6901` and `test-db` image with temporary storage (so it's wiped every run)
- Run all tests in `tests/api` targeting the `test-picr` container
- Stop docker containers

`npm run test:e2e`:

- Starts the same Dockerized test backend via `tests/api/testEnvironment.ts`
- Runs frontend browser smoke tests in `tests/e2e`
- Fails on browser console errors for core route smoke checks
- Stops docker containers
- Uses Docker images built from local `dist` output artifacts

`npm run test:e2e:fresh`:

- Rebuilds local `dist` artifacts (`backend` + `frontend`)
- Then runs `npm run test:e2e`
- Best choice when validating recent frontend source changes

## Current Coverage

Current testing is still integration-focused and intentionally lightweight:

- Backend: broad GraphQL endpoint behavior checks, plus focused unit tests for backend primitives
- Frontend: basic "page loads cleanly" smoke checks for public links

## ZIP compression benchmark

For issue [#134](https://github.com/IsaacInsoll/PICR/issues/134), PICR's ZIP writer
was compared with deflate levels 1, 3, 6, and 9 using all four real CR3 files from
[PhotoPrism's sample directory](https://dl.photoprism.app/samples/Formats/Raw/CR3/).
The originals totalled 115,150,482 bytes (115.15 MB).

STORE (no ZIP compression) was approximately **12–15 times faster than level 9**,
with an archive **0.66% larger**. Deflate levels 1–9 saved only 0.64–0.66% compared
with STORE. This is the measured reason gallery delivery uses `store: true`.

| ZIP mode | Archive size (MB) | 2 cores (s) | 4 cores (s) | 8 cores (s) |
| -------- | ----------------: | ----------: | ----------: | ----------: |
| STORE    |           115.151 |       0.236 |       0.180 |       0.168 |
| Level 1  |           114.418 |       2.639 |       2.556 |       2.613 |
| Level 3  |           114.409 |       2.606 |       2.562 |       2.685 |
| Level 6  |           114.396 |       2.715 |       2.622 |       2.573 |
| Level 9  |           114.395 |       2.744 |       2.511 |       2.585 |

Method and limits:

- AMD Ryzen 7 3700X, Node 24.13.0, Archiver 7; one gallery with sequential entries.
- CPU affinity allowed 2, 4, or 8 physical cores, using one logical CPU per core
  and excluding SMT siblings. This was an affinity limit, not a Docker CPU quota.
  The Node worker pool stayed at four threads.
- Each configuration ran three times in rotated order. The table shows medians.
  Source checksum reads warmed the filesystem cache. Timing includes destination
  completion, but excludes checksum verification and temporary-file cleanup.
- Every one of the 180 archived entries matched the original SHA-256. The
  temporary media and archives were removed; [raw measurements](data/cr3-zip-compression.json)
  retain all runs, CPU time, sample filenames, and methods.
- Deflate averaged roughly one busy CPU core, and extra cores did not provide
  meaningful compression scaling. Archiver's per-archive entry queue is serial.
  STORE did benefit modestly from additional cores.
- These results describe these four CR3 samples on this machine. They do not
  establish savings for every RAW variant, JPEG, video, or other format, and they
  do not predict absolute timings on the reporter's Beelink hardware.

## Troubleshooting 'ALL TESTS FAILING'

If every test fails then it's probably because the `test-picr` container isn't booting up okay.
You can troubleshoot this with `cd tests/api && docker compose build && docker compose up`

This will build the container then start it, with all output going to the terminal (rather than hidden like when running tests)

Common faults include:

1. You didn't run all the pre-build steps like `./copy-files.sh`, `npm install`, `npm run build` etc
2. You wrote some code that works in 'existing' dev environment but breaks on a 'first run' (EG: expecting a DB field to be defined)

## Creating Tests

- Add backend API integration tests in `tests/api` (numbered `.test.ts` files).
- Add pure backend primitive tests as `*.unit.test.ts`; mock DB/filesystem dependencies and keep them Docker-free.
- Add frontend browser smoke tests in `tests/e2e` (`*.smoke.spec.ts`).
- Keep frontend smoke tests self-contained (create their own test data and clean up).

## When are tests run?

- Main backend/frontend tests run in GitHub Actions on `push` and
  `pull_request` (except app/docs/lightroom/markdown-only changes) via
  `.github/workflows/on-push.yml`.
- App compatibility checks run separately for app/shared changes via
  `.github/workflows/app.yml`. They are advisory and do not block the main
  artifact workflow.
- Tests are also run for release workflows before Docker images are pushed.
- Tests are not run before each local commit by default.
- You can manually run `npm run test` before commit to verify locally\*

`npm run workflow` runs the GitHub workflow locally through `act`. Docker Buildx
steps use GitHub Actions cache settings (`cache-from/cache-to: type=gha`), and
under `act` the build can succeed but the job still fail while exporting cache
or build records to the local artifact-cache server. A failure like
`exporting to GitHub Actions Cache ... dial tcp ... connect: connection refused`
after `RUN ... npm run build` completed is an `act`/artifact-cache failure, not
evidence that the image build itself failed. Re-run the workflow; if it repeats,
validate the same Docker build without the GHA cache before debugging app code.

`npm run workflow:app` runs the path-filtered app compatibility workflow
directly through its `workflow_dispatch` event, so local testing does not depend
on `act` reproducing GitHub's changed-path detection.

With local `act` 0.2.89, `--dryrun` can fail before any job step with
`listen tcp: lookup <nil>: no such host` while starting its internal services.
Use `npm run workflow:app -- --list` for a parse/selection check, or run the
workflow normally for full validation; the dry-run failure is not an app build
result.

\* I didn't want to force this on you as it's a bit of time "wasted" doing builds/tests if just commiting a small change.
