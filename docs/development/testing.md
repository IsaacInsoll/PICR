# Testing

## Current test procedure

> Pro Tip: Run all the build commands first before testing (EG: `npm run build`)

Testing now has two integration suites:

- `tests/api`: backend API coverage (Vitest + Docker)
- `tests/e2e`: basic frontend smoke coverage (Playwright + Docker)

Run everything with `npm run test`, or run suites individually:

- `npm run test:api`
- `npm run test:e2e:install` (browser binaries)
- `npm run test:e2e`

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

## Current Coverage

Current testing is still integration-focused and intentionally lightweight:

- Backend: broad GraphQL endpoint behavior checks
- Frontend: basic "page loads cleanly" smoke checks for public links

## Troubleshooting 'ALL TESTS FAILING'

If every test fails then it's probably because the `test-picr` container isn't booting up okay.
You can troubleshoot this with `cd tests/api && docker compose build && docker compose up`

This will build the container then start it, with all output going to the terminal (rather than hidden like when running tests)

Common faults include:

1. You didn't run all the pre-build steps like `./copy-files.sh`, `npm install`, `npm run build` etc
2. You wrote some code that works in 'existing' dev environment but breaks on a 'first run' (EG: expecting a DB field to be defined)

## Creating Tests

- Add backend API integration tests in `tests/api` (numbered `.test.ts` files).
- Add frontend browser smoke tests in `tests/e2e` (`*.smoke.spec.ts`).
- Keep frontend smoke tests self-contained (create their own test data and clean up).

## When are tests run?

- Tests are run before each release as part of the `release-it` configuration.
- Tests are no run before each commit.
- You can manually run a `npm run test` before commit to make sure it works\*

\* I didn't want to force this on you as it's a bit of time "wasted" doing builds/tests if just commiting a small change.
