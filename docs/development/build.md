## Build Process (frontend/backend)

The build process is in `.github/workflows/build.yml`.

- Github will automatically run this on every push to `master`
- You can run it locally with the following command: `npm run workflow`

The beta React Native app has a separate compatibility workflow. It runs only
when `app`, `shared` or app build configuration changes, and it is not part of
the main backend/frontend artifact job. Run it locally with
`npm run workflow:app`. Keep the app check advisory rather than making it a
required branch-protection check.

`npm run workflow` depends on the local `act` version supporting the Node.js
runtime declared by the workflow actions. If `act` fails before running any
PICR build steps with an error like `runs.using ... got node24`, update `act`
before investigating project build failures. On macOS/Homebrew installs, check
with `act --version` and update with `brew upgrade act`.

This will run the following commands in order. You can run any of these individually at any time

| Command                        | Description                            | Notes                                                         |
| ------------------------------ | -------------------------------------- | ------------------------------------------------------------- |
| `cd shared && npm ci`          | 🗃️ Install shared deps                 | Used by backend/frontend/app builds                           |
| `cd backend && npm ci`         | 🗃️ Install backend deps                |                                                               |
| `cd backend && npm run build`  | 🗃️ Build backend + copy artifact files | Runs TSC, then copies package files + migrations into `dist/` |
| `cd dist && npm ci --omit=dev` | 🗃️ Install runtime deps for artifact   | Installs only backend runtime deps into `dist/node_modules`   |
| `cd frontend && npm ci`        | 💄 Install front end deps              |                                                               |
| `cd frontend && npm run build` | 💄 Build frontend (vite)               | Finds any frontend 'build blockers'                           |
| `npm run test:api`             | 🧪 Run backend API integration tests   | Vitest + Docker (`tests/api`)                                 |
| `npm run test:e2e:install`     | 🧪 Install Playwright browsers         | Needed before frontend smoke tests                            |
| `npm run test:e2e`             | 🧪 Run frontend smoke tests            | Playwright + Docker (`tests/e2e`)                             |
| `npm run test`                 | 🧪 Run all tests                       | Runs `test:api` then `test:e2e`                               |
| _build artifact_               | 🗜️ Do locally with `npm run workflow`  |                                                               |

The app compatibility workflow installs the root, `shared` and `app`
dependencies, then runs app lint, type checking, unit/component tests, the
Hermes polyfill check, and both Expo exports. The root install is required
because the app imports the repository ESLint config, whose plugins are owned by
the root package. Expo Doctor is deliberately reserved for app release
preflight: its dependency compatibility findings should not make routine
shared-code CI noisy.

## Local DX helper commands

To avoid repeated folder hopping:

| Command               | Description                                                                           |
| --------------------- | ------------------------------------------------------------------------------------- |
| `npm run install-all` | Install root + shared + backend + frontend + app + dist dependencies                  |
| `npm run build:local` | Build backend artifact, package Lightroom plugin, build frontend, install `dist` deps |

`copy-backend-files.sh` is used by both local helper commands and container-style
source builds. Keep it POSIX `sh` compatible so it works in Alpine/minimal Node
images that do not ship Bash.
