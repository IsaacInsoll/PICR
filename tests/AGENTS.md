# Tests Guide

Testing is split into two suites under `tests/`:

- `tests/api/`: backend API integration tests (Vitest + Docker)
- `tests/e2e/`: basic frontend browser smoke tests (Playwright + Docker)

## Scope

- API tests validate GraphQL/backend behavior against the Dockerized backend.
- E2E tests validate that key frontend routes load in a browser and do not throw console errors.
- Keep these suites integration-focused; do not add frontend component unit tests here.

## GraphQL Reuse Rules

- For `tests/api`, do not write inline GraphQL strings for app behavior.
- In `tests/api`, import shared operations from `shared/urql/queries/*` and `shared/urql/mutations/*` so tests validate real client documents.
- In `tests/e2e`, keep browser-smoke GraphQL operations local to `tests/e2e/` (for example `tests/e2e/mutations.ts`) to avoid Playwright TypeScript loader issues with generated GraphQL enum files.
- Reuse existing GraphQL test helpers where compatible with the runner.
- In `tests/e2e` Playwright tests, avoid importing enums from `graphql-types.ts` (Playwright TS loading can fail on enums).
- For GraphQL enum inputs in Playwright tests, pass the enum literal string value (for example `'Read'`) instead.

## Directory Layout

```text
tests/
├── AGENTS.md
├── api/
│   ├── compose.yml
│   ├── env/
│   ├── testEnvironment.ts
│   ├── testSetup.ts
│   ├── testVariables.ts
│   └── *.test.ts
└── e2e/
    ├── playwright.config.ts
    ├── globalSetup.ts
    ├── globalTeardown.ts
    └── *.smoke.spec.ts
```

## Commands

- `npm run test:api`: run backend API Vitest suite
- `npm run test:e2e:install`: install Playwright browser binaries
- `npm run test:e2e`: run frontend Playwright smoke suite
- `npm run test:e2e:fresh`: rebuild local `dist` artifacts, then run frontend Playwright smoke suite
- `npm run test`: run both suites in order (`api` then `e2e`)

## Local Build Requirement For E2E

- Local Playwright runs start Docker from prebuilt `dist` outputs.
- This means local `npm run test:e2e` can miss recent `frontend/src` changes if `dist` is stale.
- For meaningful frontend runtime validation, run a fresh local build first.
- Preferred command: `npm run test:e2e:fresh`.

## CI Expectations

- CI runs `test:api` and `test:e2e` separately.
- `tests/api` and `tests/e2e` each bootstrap their own Docker test environment via `tests/api/testEnvironment.ts`.
