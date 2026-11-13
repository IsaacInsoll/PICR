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

## Security dependency maintenance

The 1.6.5 preparation updates Node 24.13.0 to 24.22.3 in the repository runtime
pin and both Dockerfiles. Image builds also apply Alpine package updates:
changing the Node tag alone left an older zlib installed. Production images
install dependencies before removing npm/npx and npm's independent dependency
tree; their entrypoints and health checks use `node` directly. Use the host
checkout or a build stage for package-manager commands, not a running production
container.

Compatibility review for this update:

- Sharp 0.35.3 → 0.35.5: reviewed both intervening
  [changelogs](https://sharp.pixelplumbing.com/changelog/v0.35.5/), including
  native-library updates, bounds checks, TIFF/page metadata, input streams, and
  gain-map operations. The committed backend manifest history shows upgrades
  from 0.33 to 0.34 to 0.35.3, with no recorded Sharp rollback found. Keep the
  existing image/video and browser visual tests as the release guard; do not
  change snapshots merely to accommodate an unexplained encoder difference.
- [Archiver 8](https://github.com/archiverjs/node-archiver/releases/tag/8.0.0)
  requires modern Node/ESM and replaces the default factory with `ZipArchive`.
  PICR retains STORE, ZIP64, exact original bytes, atomic publication, and
  missing-source/destination-error cleanup.
- [Zod 4](https://zod.dev/v4/changelog) changes error customization, the error
  issue property, defaults, and integer/collection validation. Configuration
  tests preserve missing-variable messages, boolean coercion, optional values,
  and defaults. The Ping request test verifies oversized arrays are rejected
  before their entries are validated. No protocol or environment variable was
  added by this migration.
- [GraphQL Scalars 2](https://github.com/graphql-hive/graphql-scalars/releases/tag/v2.0.0)
  drops old Node and GraphQL support; PICR already meets both requirements.
  Version 2.0.1 fixes the PhoneNumber regex, although PICR does not use that
  scalar. Regenerate GraphQL outputs and check for schema drift.
- [join-images 1.5](https://github.com/ccpu/join-images/releases/tag/v1.5.0)
  adds true ESM output. PICR's named `joinImages` call remains supported and is
  exercised by video-processing integration tests.
- [minimatch 11](https://github.com/isaacs/minimatch/blob/main/changelog.md)
  removes regexp/parser APIs. Overrides target only callers inspected to use
  its retained public matching APIs. The CSS type generator's promise-based
  Glob call supports [Glob 14](https://github.com/isaacs/node-glob/blob/main/changelog.md);
  subsystem lint verifies the generated CSS declarations after this override.
- [basic-ftp 6](https://github.com/patrickjuchli/basic-ftp/blob/master/CHANGELOG.md)
  rejects separate transfer hosts by default. The scoped get-uri override keeps
  release tooling's Client API and adopts that safer default.
- [release-it 21.1](https://github.com/release-it/release-it/releases/tag/21.1.2)
  includes a semver-to-verkit migration as well as security fixes. Keep release
  version calculation in validation; publishing remains a human action.
- [i18next CLI](https://github.com/i18next/i18next-cli/compare/v1.69.2...v1.87.0)
  includes extractor/status changes as well as patched Glob/minimatch. Run the
  repository's complete catalog check after updating it. Vite 8.3 and Astro 7.4
  remain within their existing majors; browser tests and the docs
  check/build/link check cover their respective consumers.

The remaining backend audit findings are four moderate development-only entries
for Drizzle Kit's deprecated esbuild-kit loader and nested esbuild. The advisory
concerns esbuild's development HTTP server, which PICR does not expose through
this migration tool. Keep the supported Drizzle Kit version rather than accepting
npm's suggested downgrade to 0.18.1 or forcing a different esbuild API into its
old loader. Revisit when the upstream tool removes that dependency. Audit the
production install separately with `--omit=dev`.
