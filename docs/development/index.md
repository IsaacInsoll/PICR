# Development

| Doc                                        | Notes                                       |
| ------------------------------------------ | ------------------------------------------- |
| 🎉 [Contributing](../CONTRIBUTING.md)      | Contribution Guidelines                     |
| 🎉 [Initial Setup](initial-setup.md)       | How to setup development environment        |
| 📱 [App Development](app.md)               | React Native (Expo) App Development         |
| 👷 [Build Process](build.md)               | How backend build process works             |
| 🎨 [Frontend Styling](frontend-styling.md) | Mantine-first UI + typed CSS modules        |
| 📃 [Basic Tutorial](basic-tutorial.md)     | Basic tutorial on front/backend feature dev |
| 🧪 [Testing](testing.md)                   | Run API + E2E integration tests             |
| 🚀 [Releases](release.md)                  | How to do releases                          |
| 🐛 [Troubleshooting](troubleshooting.md)   | Troubleshooting tips                        |

## Folders

| Folder     | Description                                      |
| ---------- | ------------------------------------------------ |
| `backend`  | Node server source                               |
| `frontend` | React frontend source                            |
| `shared`   | Client logic shared by `frontend` and `app`      |
| `app`      | iOS/Android App (Expo / React Native)            |
| `dist`     | _Compiled_ source (frontend/backend/extra files) |

## Development CLI Commands

| Command                                                     | Description                                            | When to use                                                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `npm start`                                                 | Run "_everything_": Server / DB / Frontend in Dev Mode | Used for 90% of development. <br /> Uses `tsx watch`/Vite to reload on changes                          |
| `cd frontend && npm run css:types`                          | Generate typed CSS module declarations                 | Run after adding/renaming/removing CSS module class names                                               |
| `cd frontend && npm run css:types:check`                    | Verify typed CSS module declarations are current       | Runs in frontend lint/CI guard; useful before commit                                                    |
| `npm run gql`                                               | Build GQL files                                        | Run after updating any GQL on server to "see" new stuff, <br />or after updating a query on client side |
| `cd backend && MIGRATION_NAME=<yodawg> npm run dk:generate` | generate migration files                               | Run when db schema modified and you want to commit changes                                              |
| `cd backend && npm run dk -- push`                          | Apply schema directly (no migration file)              | Fast local prototyping before a feature is ready to ship                                                |
| `cd backend && npm run dk -- migrate`                       | Manually apply committed migration files               | Optional: useful for debugging/recovery. Backend startup usually applies these automatically.           |

## Drizzle Common Workflows

For iterative weekly releases, many migration files are normal and not a problem by themselves.

- Do not edit/delete migrations that have already shipped.
- Prefer small, additive schema changes per PR/release.
- Keep schema changes and related app code in the same release.
- Backend startup runs Drizzle `migrate()` and applies committed migrations automatically.
- Use `push` while prototyping locally, then `generate` and commit the migration before merge/release.
- Validate by starting/restarting backend and confirming migrations apply cleanly.
- If migration history becomes cumbersome, create a fresh baseline at a major version and keep a documented upgrade path for existing installs.

## Dev Server

Ports are exposed during development:

| URL                   | Name                  | Description                                                                                                               |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| http://localhost:6900 | PICR Server (backend) | The live updating backend (using `tsx watch`) if you did `npm start`, or a built backend if you are running the container |
| http://localhost:6969 | Front End             | Dynamic frontend (vite HMR) which forwards GQL/file requests to backend (above)<br/>best for front end development        |
| http://localhost:6901 | Testing Server        | When running tests we build a container using this port for running tests against                                         |

For front end development you definitely want to use the 6969 address. For backend either would be fine but I typically just use 6969 anyway.

Frontend note:

- `npm start` runs CSS module type generation in watch mode automatically (`start:css:types`).

### Backend Dev Server Details

The backend dev server runs via `tsx watch backend/app.ts` (TypeScript source executed directly — no compile step). Key points:

- **Must run from project root** (not `cd backend`) so `.env` is found by dotenv
- **Path aliases**: `TSX_TSCONFIG_PATH=backend/tsconfig.json` is set in `package.json` so `@shared/*` imports resolve correctly
- **Type checking**: `start:server-ts` runs `tsc --noEmit -w` in parallel for type feedback without blocking the server
- `shared/package.json` exports map includes `"./*.js": "./*.ts"` so tsx can resolve `@shared/*` to TypeScript source files

## Local Quality Gate

Before opening a PR, run these checks locally:

1. `npm run check` (format, lint, and TypeScript across all subsystems)
2. `npm run test:api`
3. `npm run test:e2e:fresh` (when frontend behavior changes)

For full CI parity, run:

- `npm run workflow`

## Current Warning Budget

Warnings are not blockers today, but should not grow:

- `backend`: avoid introducing new warnings; backend `no-console` cleanup is complete and should stay that way.
- `frontend` and `app`: `react/no-array-index-key` warnings are currently tolerated in a few components.

Rule of thumb:

- New code should not introduce additional warnings.
- If you touch a file with existing warnings, prefer cleaning up that warning in the same change.

## Logging Policy

For backend logging:

- Use `logger.info/error/...` for normal runtime logging.
- Use `log(level, message, true)` for boot/startup/migration messages that must appear in container logs.
- Avoid adding `console.*` in backend runtime code.
