# Development

| Doc                                        | Notes                                       |
| ------------------------------------------ | ------------------------------------------- |
| 🎉 [Contributing](../CONTRIBUTING.md)      | Contribution Guidelines                     |
| 🎉 [Initial Setup](initial-setup.md)       | How to setup development environment        |
| 📱 [App Development](app.md)               | React Native (Expo) App Development         |
| 👷 [Build Process](build.md)               | How backend build process works             |
| 🎨 [Frontend Styling](frontend-styling.md) | Mantine-first UI + typed CSS modules        |
| 🌐 [Translations](translations.md)         | Add and validate interface languages        |
| 🖼️ [Media Scanning](media-scanning.md)     | File detection, scans, thumbnails, moves    |
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
- For UI-only work against a remote PICR dataset, run the frontend with
  `VITE_PICR_DEV_BACKEND_URL=https://your-picr.example/ npm run start` from
  `frontend/`. Vite proxies GraphQL queries, `/image`, and `/zip` to that
  backend, blocks GraphQL mutations other than login, and shows a backend
  override banner. Only use this when the local frontend schema matches the
  remote server.

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

## Zero-Warning Lint Policy

All four subsystem lint scripts pass `--max-warnings=0`, so ESLint warnings fail the local and CI
quality gates. Fix a warning at its source rather than weakening the script or changing a rule only to
make the gate pass.

Rules such as `no-console` and frontend `react/no-array-index-key` are declared as warnings but still
block these zero-warning gates. Temporary `console.*` debugging is allowed during investigation, but
remove it before running the final `npm run check`.

The app uses Expo's wrapper and must keep the forwarding separator in
`expo lint -- --max-warnings=0`. Without `--`, Expo consumes the option before ESLint sees it.

## Logging Policy

For backend logging:

- Use `logger.info/error/...` for normal runtime logging.
- Use `log(level, message, true)` for boot/startup/migration messages that must appear in container logs.
- Avoid adding `console.*` in backend runtime code.

## Database Migration Startup Safety

PICR runs Drizzle SQL migrations in `schemaMigration()` before Express starts
listening, so anything that stalls there stalls the whole container: Docker
reports it as running while the port never opens.

Drizzle's Postgres migrator applies **every** pending migration and its
`__drizzle_migrations` bookkeeping insert inside a **single transaction**. That
is good news for recovery — a failure rolls back cleanly and leaves no
half-applied schema — but it means one blocked statement blocks the entire boot.

The realistic failure is lock contention, not slow work. DDL such as
`CREATE INDEX` needs a lock on the table, and any other session holding a
conflicting lock (an in-flight scan transaction, an `idle in transaction`
backend, an open `psql`) makes it wait. PICR sets `lock_timeout` on the
migration connection so a blocked migration fails fast and is retried, instead
of hanging forever. `lock_timeout` only applies while _waiting_ for a lock, so
it never interrupts a migration that is genuinely making progress.

This bit PICR in 1.3.6: a four-index migration on a 61k-row table — normally
sub-second — hung boot indefinitely because it could not acquire its lock, and
produced no output at all.

When writing migrations:

- Assume any DDL can block, and keep migrations small so a retry is cheap.
- Log boot/migration progress with `log(level, message, true)`. Without the
  `important` flag, output goes only to the winston file transports; the console
  transport is dev-only (`addDevLogger`), so plain `log('info', ...)` is
  invisible in production container logs.
- `CREATE INDEX CONCURRENTLY` cannot be used in a Drizzle migration, because
  Postgres forbids it inside a transaction block. If it is ever needed it has to
  run as app-level code in `dbMigrate.ts`, outside the migrator.
- When re-adding a migration that was previously released and then reverted, use
  `IF NOT EXISTS` — installs that applied the original will still have the
  objects, and the migrator gates purely on timestamp.
