# Release Workflows

## Docker/GitHub release

Run `npm run release` which will:

1. Ask for a new semver version
2. Commit, tag, and push via `release-it`
3. Create a GitHub release

The GitHub release pipeline then builds and publishes Docker images. The root
`package.json` version is the canonical release version. The `backend` build
generates `dist/version.txt` from root `package.json` for runtime compatibility.
Let `release-it` own the release commit, tag, push, and GitHub release creation
so the GitHub release tag points at the commit containing the matching
`package.json` version.

Do not manually create normal Docker/backend release tags or GitHub releases. If
the release verification guard fails, fix the tag/version mismatch before
publishing a GitHub release.

Do not recreate or commit a root `version.txt`; it is generated in `dist/` during
the backend build.

## Expo app release

### Full release (both platforms)

`npm run release:app`

This runs:

1. EAS auth check (`eas whoami`) and exits early if not logged in
2. Deterministic local install in `shared` and `app` using `npm ci`
3. Lint + TypeScript checks in `shared` and `app`
4. `expo-doctor` (advisory/non-blocking)
5. Local `expo export` for iOS only (with condensed log output)
6. App version bump in `app/package.json` using app-local `release-it` config
7. EAS build + auto-submit for iOS and Android (`production` profile)

Notes:

- App release versioning is decoupled from backend/frontend release versioning.
- `app/app.config.ts` reads version from `app/package.json`.
- App release tags are created as `app-v<version>`.
- App release push is scoped to `master` and `app-v<version>` only (does not push unrelated local tags).

### Dry run (no version bump, no EAS build)

`npm run release:app:dry`

Use this to validate everything up to preflight checks and local exports.

### Platform-specific release

- iOS only: `npm run release:app:ios`
- Android only: `npm run release:app:android`

Each platform-specific command runs full preflight + version bump, then builds/submits only that platform.

## Troubleshooting

- Ensure `GITHUB_TOKEN` is set in `.env` for GitHub release/tag operations.
- Ensure you are logged into EAS (`cd app && npx eas login`) before `release:app*` commands.
- If `git push` fails in WSL, see [this guide](https://dev.to/equiman/sharing-git-credentials-between-windows-and-wsl-5a2a).
