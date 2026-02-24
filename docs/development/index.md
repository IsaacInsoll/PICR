# Development

| Doc                                      | Notes                                       |
| ---------------------------------------- | ------------------------------------------- |
| 🎉 [Contributing](../CONTRIBUTING.md)    | Contribution Guidelines                     |
| 🎉 [Initial Setup](initial-setup.md)     | How to setup development environment        |
| 📱 [App Development](app.md)             | React Native (Expo) App Development         |
| 👷 [Build Process](build.md)             | How backend build process works             |
| 📃 [Basic Tutorial](basic-tutorial.md)   | Basic tutorial on front/backend feature dev |
| 🧪 [Testing](testing.md)                 | Run API + E2E integration tests             |
| 🚀 [Releases](release.md)                | How to do releases                          |
| 🐛 [Troubleshooting](troubleshooting.md) | Troubleshooting tips                        |

## Folders

| Folder     | Description                                      |
| ---------- | ------------------------------------------------ |
| `backend`  | Node server source                               |
| `frontend` | React frontend source                            |
| `shared`   | Client logic shared by `frontend` and `app`      |
| `app`      | iOS/Android App (Expo / React Native)            |
| `dist`     | _Compiled_ source (frontend/backend/extra files) |

## Development CLI Commands

| Command                                                                              | Description                                            | When to use                                                                                             |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `npm start`                                                                          | Run "_everything_": Server / DB / Frontend in Dev Mode | Used for 90% of development. <br /> Uses nodemon/vite to reload on changes                              |
| `npm run gql`                                                                        | Build GQL files                                        | Run after updating any GQL on server to "see" new stuff, <br />or after updating a query on client side |
| `cd backend && NODE_OPTIONS='--import tsx' npx drizzle-kit generate --name=<yodawg>` | generate migration files (optional `--name=xyz`)       | Run when db schema modified and you want to commit changes                                              |

## Dev Server

Ports are exposed during development:

| URL                   | Name                  | Description                                                                                                           |
| --------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| http://localhost:6900 | PICR Server (backend) | The live updating backend (using nodemon) if you did `npm start`, or a built backend if you are running the container |
| http://localhost:6969 | Front End             | Dynamic frontend (vite HMR) which forwards GQL/file requests to backend (above)<br/>best for front end development    |
| http://localhost:6901 | Testing Server        | When running tests we build a container using this port for running tests against                                     |

For front end development you definitely want to use the 6969 address. For backend either would be fine but I typically just use 6969 anyway.

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
