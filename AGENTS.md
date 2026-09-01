# PICR Repository Guidelines

**If a tool or command fails unexpectedly, inspect the failure and make at most one narrowly targeted retry when there is a credible correction. This includes obvious command typos, wrong file paths, shell syntax issues (for example missing quotes around a path with `[` or `]`), and patch context that can be corrected by reading the target file. If that retry also fails, or the cause is unclear, stop and ask — do not cycle through workarounds. Validation commands such as lint, typecheck, tests, builds, and format checks are different: failures from those commands are actionable project feedback, so fix the underlying issue when it is in scope, rerun the command, and report any remaining failures with evidence.**

**When you learn something about how this project works — a gotcha, a required workflow step, a pattern that isn't obvious — add it to the relevant `AGENTS.md` or `docs/` file immediately. Do not store it only in an AI-specific memory system. This project is worked on by multiple developers and multiple AI agents across different machines; anything that lives only in one agent's memory is invisible to everyone else.**

## Accuracy and Verification

When answering questions about this repository, distinguish clearly between:

- **Observed facts**: directly verified from files, git state, command output, docs, tests, or other primary sources.
- **Inferences**: conclusions based on observed facts.
- **Assumptions**: plausible but unverified statements.

Do not present an inference or assumption as a verified fact.

For claims about project state, behavior, configuration, dependencies, generated files, git tracking, CI, deployment, or developer workflow, verify with the repo before answering when practical. Prefer commands such as `rg`, `git status`, `git check-ignore`, `git ls-files`, package scripts, config files, and subsystem `AGENTS.md` files. If answering whether something is shared with other developers, committed, ignored, generated, or part of the repo, check the actual git state first and do not infer from a file merely existing in the working tree.

If a claim has not been verified, say so explicitly with language like "I have not checked that yet" or "based on the file I inspected." If the user asks a follow-up that challenges a claim, re-check the underlying evidence before defending or revising the answer.

Before giving a confident answer, ask: "What would I need to inspect to prove this?" If that inspection is cheap, do it first.

## Evidence-First Debugging

When the cause of a production or concurrency issue is not confirmed, gather
targeted evidence before committing to a mechanism. Ask for logs, SQL query
results, filesystem counts, environment values, timestamps, and reproduction
details when those facts can cheaply distinguish between plausible causes.

Keep requests specific and low-risk:

- Prefer read-only SQL and log greps first. If a write is needed, wrap it in a
  transaction and ask the user to inspect `RETURNING` rows before commit.
- Ask for exact timestamps and timezone context when correlating logs with user
  actions.
- Compare independent sources, such as disk file counts vs database row counts,
  or application logs vs SQL aggregates.
- Re-check assumptions when new evidence contradicts them. State what changed:
  the observed fact, the inference it invalidated, and the new working theory.

Do not turn debugging into a fishing expedition. Each requested query/log should
answer a concrete question, such as "are these real duplicate rows?", "which code
path produced them?", or "would cleanup lose comments/flags/foreign-key refs?".

## Agent Operating Standard

Work like a senior developer, not a command runner. Before changing code or giving architectural guidance, inspect the existing implementation, nearby patterns, relevant subsystem `AGENTS.md`, tests, and configuration. Do not implement from memory when the repo can answer the question cheaply.

Prefer primary sources over assumptions:

- For repo behavior: source code, tests, config, scripts, generated-file instructions, CI files, git state, and issue comments.
- For dependency or platform behavior: official docs, changelogs, package metadata, or upstream source.
- For user-facing behavior: existing UI flows, docs, screenshots, tests, and route/API contracts.

When requirements are ambiguous, choose the smallest reversible change that matches existing patterns. If there are meaningful tradeoffs, state them briefly before or while implementing. Ask a question only when the answer cannot be discovered from local context and a reasonable assumption would be risky.

When reviewing or debugging, look for the root cause instead of patching symptoms. Validate that the proposed fix addresses the observed failure mode, and call out adjacent risks if the investigation reveals them.

## JavaScript/TypeScript Project Practices

- Fix TypeScript errors at the source. Avoid `any`, broad casts, non-null assertions, or local type shims unless the surrounding code already establishes that pattern or the runtime invariant has been verified.
- For React/Vite UI changes, validate the rendered behavior when practical: run the relevant dev server or build, inspect browser console/network failures when available, and use screenshots or Playwright for layout-sensitive work.
- For dependency, script, build, Vite, ESLint, TypeScript, or Node runtime changes, inspect the relevant `package.json`, lockfile, config file, and CI/test command before editing. Keep root and subsystem package files in sync when the repo structure requires it.
- For async/server code, verify error handling and logging behavior on the failure path, not just the happy path. Do not swallow errors to make tests pass.

## Definition of Done

Before finalizing a task:

- Run the narrowest relevant lint, typecheck, test, build, or formatting command for the touched subsystem unless blocked.
- State exactly which checks were run and whether they passed.
- If a required check could not be run or failed for an unrelated pre-existing reason, say so clearly and include the evidence.
- Call out generated files, schema changes, migrations, new environment variables, user-facing behavior changes, and documentation updates.
- Do not claim the work is complete if verification is missing and the missing check is material to the change.

### Run the checks before every commit, not just at the end of a task

"Narrowest relevant" above means the narrowest _subsystem_ command, not the narrowest file. Before **each** commit, for
every subsystem the commit touches, run:

- `npm run format` then `npm run format:check`
- `npm run lint` in the subsystem (`eslint <file>` is not a substitute — subsystem lint also runs checks such as
  `css:types:check` in `frontend`)
- `npx tsc --noEmit` in the subsystem
- `npm run i18n:check` from the root if any user-facing string or locale catalog changed

The full test suite is deliberately **not** on that list; it belongs to `npm run workflow`, which the user runs. The root
`npm run check` script bundles format, lint, tsc, and i18n if you want them in one go.

Re-run these after **rebasing or merging** as well. A rebase can combine two individually-clean commits into a broken
one, for example by keeping both sides of an edit to the same lines, and no check performed before the rebase covers
that.

PICR is an open-source photo/video gallery for photographers to share media with clients. Deployed via Docker for self-hosting, with a React Native companion app.

## Project Links

| Resource           | URL                                                                |
| ------------------ | ------------------------------------------------------------------ |
| GitHub Repository  | https://github.com/IsaacInsoll/PICR                                |
| GitHub Issues      | https://github.com/IsaacInsoll/PICR/issues                         |
| Documentation Site | https://isaacinsoll.github.io/PICR/                                |
| Docker Hub         | https://hub.docker.com/r/isaacinsoll/picr                          |
| iOS App            | https://apps.apple.com/us/app/picr-client/id6748066012             |
| Android App        | https://play.google.com/store/apps/details?id=com.isaacinsoll.picr |

## Working on GitHub Issues

When working on a GitHub issue:

1. **Reference the issue** in commits: `✨ #42 [frontend] add feature description`
2. **Understand the full context** - fetch the issue URL to read all comments and discussion
3. **Check for labels** - `currently working on` means it's in progress
4. **Test thoroughly** - ask the user to run `npm run workflow` before considering work complete
5. **Update related docs** if the change affects user-facing behavior

### Fetching Issue Details

To understand an issue fully, fetch it:

```
https://github.com/IsaacInsoll/PICR/issues/<number>
```

Or use `gh issue view <number>` if the GitHub CLI is available.

If plain `gh issue view <number> --comments` fails with a GraphQL error about
`repository.issue.projectCards`, request only the fields needed for issue
context:

```bash
gh issue view <number> --comments --json number,title,state,body,comments,labels
```

## Project Structure

| Directory    | Purpose                                                            | Has AGENTS.md |
| ------------ | ------------------------------------------------------------------ | ------------- |
| `backend/`   | Node/Express/Drizzle GraphQL API, media processing, notifications  | Yes           |
| `frontend/`  | Vite + React 19 admin UI                                           | Yes           |
| `shared/`    | Code shared between frontend and app (types, queries, utilities)   | Yes           |
| `app/`       | Expo/React Native mobile client                                    | Yes           |
| `tests/`     | API integration tests (Vitest) + frontend smoke tests (Playwright) | Yes           |
| `lightroom/` | Lightroom Classic plugin prototype (Lua)                           | Yes           |
| `ping/`      | NAS-side media watcher and PICR change-hint delivery container     | Yes           |
| `docs/`      | Astro/Starlight customer docs and repo-native developer docs       | No            |

**Read the subsystem AGENTS.md files when working in those directories** - they contain detailed patterns, code examples, and troubleshooting guides. This applies equally when **planning** changes, not just implementing them — read the relevant subsystem AGENTS.md files before writing any plan that touches that subsystem.

## Documentation Boundaries

- Root `readme.md` is customer-facing and should not be updated for developer workflow/troubleshooting notes.
- Published customer documentation belongs under `docs/src/content/docs/*`. Astro/Starlight builds these files into the GitHub Pages site with clean, extensionless routes.
- Durable guides for human developers and contributors belong under `docs/development/*` (for example, a guide to adding translations). These files and `docs/CONTRIBUTING.md` remain repository-native Markdown and are not published by Starlight.
- The `docs/` directory is an independent npm package. Install it with `npm --prefix docs ci`, preview it with `npm --prefix docs start`, validate it with `npm --prefix docs run check`, and build it with `npm --prefix docs run build`. Run `npm --prefix docs run check:links` after building.
- `docs/.astro/` and `docs/dist/` are generated, ignored by Git and excluded from root Prettier checks. Do not commit or edit them directly.
- Keep `ASTRO_TELEMETRY_DISABLED=1` in the Astro package scripts. Without it, Astro attempts to write telemetry preferences outside the workspace in some development and sandbox environments.
- Search is generated during the production build and may not appear in the development server.
- `.github/workflows/docs.yml` validates documentation pull requests and deploys `master` to the existing `/PICR/` GitHub Pages site. Before the first deployment, set the repository's Pages source to **GitHub Actions**.
- The docs package is intentionally omitted from Dependabot for now. Do not add a docs npm entry unless that decision is revisited.
- Temporary implementation plans and working notes belong under `.scratch/`, not in the generated documentation.
- Agent-specific repository instructions and recurring AI workflow guidance belong in the relevant `AGENTS.md`.

## IDE Project Files

- `.idea/` is ignored by git. JetBrains IDE files such as `.idea/dataSources.xml` may exist locally, but they are not shared with other machines unless the ignore rules are deliberately changed or files are explicitly force-added.

## Autogenerated Files (Do Not Edit)

These files are regenerated by `npm run gql`:

- `./schema.graphql`
- `shared/urql/graphql.schema.json`
- `shared/gql/*`

`npm run gql` imports the executable schema from
`backend/graphql/schema.ts`, validates it, writes an ignored introspection
snapshot to `.scratch/codegen-schema.json`, and runs codegen from that snapshot.
It does not require a running backend, database, configured environment, or
open HTTP port. The temporary snapshot is an implementation detail and must not
be committed.

The GraphQL Codegen configuration and `@graphql-codegen/*` dependencies live in
`backend/` deliberately. The executable schema producer and every codegen plugin
must resolve backend's direct `graphql` dependency from the same package tree.
Do not move codegen back to the root: a newer backend GraphQL can emit
introspection enum values that an older transitive root GraphQL cannot
re-introspect. Root `npm run gql` is only the repository-level wrapper.

A backend `graphql` version bump can legitimately change
`shared/urql/graphql.schema.json`, because that tracked file includes
graphql-js's own introspection schema. Dependabot cannot run codegen, so its PR
may pass generation but fail the subsequent generated-file diff. Run
`npm run gql` on the Dependabot branch and commit the regenerated artifact;
this expected drift is not a recurrence of the producer/consumer version-skew
failure.

Do not manually edit generated files, and do not add local type workarounds to
work around missing generated types. Run `npm run gql` and commit the resulting
tracked outputs before continuing with type-dependent code.

CI regenerates these files and fails the build if the committed copies differ
(`🔄 [codegen] Verify generated GraphQL files are up to date` in
`.github/workflows/build.yml`). If that step fails, run `npm run gql` and commit
the result - do not edit the generated files by hand to satisfy it.

`app/src/graphql.schema.json` was deleted: nothing imported it, and it was never
a codegen output. The schema URQL actually uses for cache validation is
`shared/urql/graphql.schema.json`.

## User Model & Access Control

This is a cross-cutting concern affecting backend auth, frontend routing, and app access.

### Two User Types (Same Table)

Users are stored in `backend/db/models/dbUser.ts` with two modes:

| Type      | Authentication                | Access Level                            | Created By               |
| --------- | ----------------------------- | --------------------------------------- | ------------------------ |
| **Admin** | `username` + `hashedPassword` | Full admin to folders under home folder | `editAdminUser` mutation |
| **Link**  | `uuid` (in URL/header)        | View-only to folders under home folder  | `editUser` mutation      |

### Home Folder = Access Scope

- Every user has a `folderId` (their "home folder")
- Users can only access content within their home folder's subtree
- `folderId = 1` (root) = full access to everything
- Admin users get `Admin` permissions; Link users get `View` permissions

### Public Link URL Pattern

```
/s/:uuid/:folderId/:fileId?
```

- Frontend detects `/s/:uuid/...` routes and sends UUID in request header
- GraphQL auth checks JWT first, falls back to UUID header

### Comment Permissions

Per-user setting (`commentPermissions`): `edit` | `read` | `none`

- Only `edit` allows creating comments
- `read` allows comment/rating/flag queries but rejects mutations; `none` also rejects comment queries, so clients should hide all review UI

### Link Modes

`linkMode` controls download behavior:

- `final_delivery` - Downloads enabled
- `proof_no_downloads` - Downloads disabled (proofing workflow)

### Known Issues / Tech Debt

- Admin vs Link split is implicit - both fields can be set simultaneously
- `userType = User` exists in enums but no mutation creates it
- Access logs filter to Link users regardless of `userType` argument

## Build, Test & Development Commands

```bash
# Development
npm start                    # Full dev stack (backend + frontend + Docker DB)
npm run start:server         # Backend only (tsx watch on source files)
npm run start:client         # Frontend only (Vite dev server)
npm run start:db             # Database only (Docker)

# Dev runtime note
# `npm start` runs the backend directly from `backend/app.ts` via `tsx watch`.
# Type checking runs separately via `npx tsc --noEmit -w`.
# Build/test/docker still run the compiled backend from `dist/server`.
# If compiled runtime fails with ERR_MODULE_NOT_FOUND from `dist/server`, run:
# sh ./copy-backend-files.sh && npm --prefix dist ci --omit=dev

# Building
cd backend && npm run build  # TypeScript → dist/server (for Docker image)
cd frontend && npm run build # Vite production build
cd app && npx expo export --platform android  # or --platform ios on macOS
npm --prefix docs run build  # Astro/Starlight documentation site

# Testing
npm run workflow             # Full CI workflow (user runs this manually)
npm run test:api             # Backend Vitest integration suite (AI may run locally)
npm run test:e2e             # Playwright smoke tests (AI may run locally)
npm run test:e2e:fresh       # Rebuild dist artifacts, then run Playwright smoke tests
cd frontend && npm run test:unit # Frontend-owned Docker-free unit tests

# Code Generation
npm run gql                  # Regenerate GraphQL types (safe to run anytime)
npm run i18n:check           # Verify source translation keys exist in every locale catalog

# Frontend CSS module types
cd frontend && npm run css:types        # Generate/update *.module.css.d.ts files
cd frontend && npm run css:types:check  # Verify generated CSS module types are up to date

# Type Checking
npm run tsc                      # All subsystems at once
cd backend && npx tsc --noEmit   # Backend only
cd frontend && npx tsc --noEmit  # Frontend only
cd shared && npx tsc --noEmit    # Shared only
cd app && npm run typecheck      # App only
cd ping && npm run typecheck     # Ping only

# Install sequencing
npm run install-all              # Preferred install flow for all subsystems

# Local install note
# `frontend` and `app` both depend on `shared`, but installs are now explicit.
# If installing subsystems manually, install `shared` first, then `frontend` / `app`.
# Do not run `npm install` for `shared`, `frontend`, and `app` in parallel.
# `npm run i18n:check` imports shared runtime modules for its catalog contract
# test, so install both root and `shared` dependencies before running it.

# Lockfiles after changing a dependency
# Use the Node version from `.nvmrc` and normal npm peer-dependency resolution.
# Update the owning package's existing lockfile in place with a targeted
# `npm install` or `npm uninstall`; do not delete/recreate the lockfile or use
# `--legacy-peer-deps` for a routine dependency change.
# Inspect the package.json and package-lock.json diff before committing. It should
# contain only the requested dependency and transitive packages that are no longer
# required. In particular, do not accept unrelated or platform-specific lockfile
# churn from a macOS install: CI installs on Ubuntu. Restore the lockfile and
# investigate if the diff is broader than expected.
# Run plain `npm ci` in every changed package before committing (exactly what CI
# runs). Peer warnings may be reported, but the command must exit successfully.
# A package-lock `peer: true` flag describes peer-dependency reachability, not
# the developer's operating system. npm may recalculate these flags across the
# whole ideal tree after an otherwise targeted install. Different npm versions,
# install flags, existing node_modules trees, and platform-optional packages can
# all expose noisy flips; `.nvmrc` pins Node but not an independently upgraded
# npm. Record both `node --version` and `npm --version` when investigating churn,
# discard unrelated flag-only changes, and confirm the cleaned lock with `npm ci`.
# `i18next-cli` intentionally lives in the root devDependencies. Its published
# package directly depends on React, react-i18next, i18next and cross-platform
# SWC binaries, so its legitimate lockfile footprint is large. Do not move it to
# `frontend` or mistake the root React version it installs for PICR's frontend
# runtime version.
# `i18next.config.ts` scans both `frontend/src` and `shared` for catalog keys.
# Keep its `**/node_modules/**` exclusion when broadening source globs; without
# it, the CLI traverses subsystem dependencies and only warns on parse failures.
# Shared translation call sites must use an extractor-recognized `t(...)` call,
# or the extractor configuration must be updated with the new call pattern.
# Runtime-selected translation families must also be listed under their owning
# namespace in `dynamicCatalogPatterns`. `npm run i18n:check` combines the CLI's
# static and unused-key reports with a cross-locale contract because
# `i18next-cli status` does not include preserved dynamic keys in its
# missing-translation count.
# Add `app` to the extraction inputs when app translation work begins.

# Formatting
npm run format               # Apply Prettier formatting across the repo
npm run format:check         # Verify formatting only (same check used in CI)

# Releases (human only, except for dry runs)
npm run release              # GitHub/Docker release version bump/tag flow
npm run release:app          # App preflight + version bump + EAS iOS/Android auto-submit
npm run release:app:dry      # App preflight only (no bump/build), AI LLM can run this anytime as a check before
npm run release:ping -- patch # Ping preflight + version bump + commit; image publishing runs after push
```

### Dependabot Configuration

Dependabot's `cooldown` option is ecosystem-specific. GitHub currently rejects
`cooldown.semver-major-days` for `package-ecosystem: github-actions`; keep
cooldowns on the npm update entries rather than copying them into the Actions
entry. PICR intentionally checks grouped npm minor/patch updates monthly with a
21-day minor and 7-day patch cooldown, ignores routine npm major-version PRs,
and checks grouped GitHub Actions updates quarterly.

The React Native app is a deliberate exception: `/app` is fully excluded from
Dependabot PRs, both version and security updates, because Expo/React Native
dependency upgrades break easily and are coordinated manually during app
maintenance. Implementing that requires an `ignore` rule, not just a limit:

- `open-pull-requests-limit: 0` disables **version** updates only. Security
  update PRs are explicitly not subject to that limit, so `/app` still received
  grouped security PRs (for example #114) while the limit was `0`.
- `ignore` applies to **both** version and security updates, so
  `ignore: [{ dependency-name: '*' }]` on the `/app` entry is what actually
  stops every PR. Keep that rule; do not "simplify" it away.
- Closing a grouped Dependabot PR does not add ignore rules for the versions it
  contained, so closing those PRs by hand never makes them stop recurring.

Excluding `/app` from Dependabot PRs does not silence its Dependabot alerts;
those still appear in the repository security tab and are the intended way to
review app vulnerabilities before a manual Expo upgrade. Do not disable the
repository-level security updates setting to reduce version-update noise; scope
the exclusion in `dependabot.yml` instead.

Security updates bypass most of the noise controls. `groups`, `cooldown`, and
`open-pull-requests-limit` all default to version updates only, so a security
wave opens one PR per dependency per directory: `js-yaml` alone produced #98,
#99, #101, and #102 because it appears in four lockfiles. Every npm entry
therefore carries a second `<name>-security` group with
`applies-to: security-updates` so those collapse into one PR per subsystem.
Keep both groups when editing an entry; a group without `applies-to` does not
cover security updates. `/app` is the exception and needs no groups at all,
since its `ignore` rule suppresses both kinds.

`cooldown` is deliberately left at 21-day minor / 7-day patch. It applies only
to version updates, so raising it delays routine bumps without reducing the
security PRs that drive most of the volume.

The five npm entries are intentionally kept separate rather than merged into a
single entry with the plural `directories` key. Consolidating would cut roughly
five monthly PRs to one, but makes review all-or-nothing across subsystems,
which does not match how PICR triages these (individual subsystem groups get
merged or closed independently). Revisit only if that changes.

Labels listed in `dependabot.yml` must already exist in the repository.
Dependabot does not create missing labels; it comments a "The following labels
could not be found" warning on every PR and drops them. Only `dependencies`
is listed for this reason - `npm` and `github-actions` were requested but never
existed, so they were removed rather than created.

Keep workflow `push` validation limited to `master`; pull requests have their
own validation event, and allowing all branch pushes doubles CI for every
Dependabot PR.

Frontend dev runtime note:

- `npm start` now runs `frontend` CSS module type generation in watch mode automatically (`start:css:types`).

### After Making Changes

Always suggest running the relevant build as a basic validation:

- Backend changes → `cd backend && npm run build`
- Frontend changes → `cd frontend && npm run build`
- App changes → `cd app && npx expo export --platform android`
- Ping changes → `cd ping && npm run build`
- Docs changes → `npm --prefix docs run check && npm --prefix docs run build && npm --prefix docs run check:links`

Run lint for each touched subsystem before finalizing changes:

- Shared changes → `cd shared && npm run lint`
- Backend changes → `cd backend && npm run lint`
- Frontend changes → `cd frontend && npm run lint`
- App changes → `cd app && npm run lint`
- Ping changes → `cd ping && npm run lint`

Run TypeScript checks for each touched subsystem before finalizing changes:

- Shared changes → `cd shared && npx tsc --noEmit`
- Backend changes → `cd backend && npx tsc --noEmit`
- Frontend changes → `cd frontend && npx tsc --noEmit`
- App changes → `cd app && npm run typecheck`
- Ping changes → `cd ping && npm run typecheck`
- All subsystems → `npm run tsc`

Run formatting before finalizing changes, then verify:

- `npm run format` — apply Prettier formatting
- `npm run format:check` — verify (this is what CI runs)
- If repo-wide formatting is noisy due to unrelated pre-existing changes, still run Prettier on all touched files and verify those explicitly:
  - `npx prettier --write <touched-files...>`
  - `npx prettier --check <touched-files...>`
- Do not stop at touched-file formatting alone. Before reporting success, always run the repo-level `npm run format:check` as a final guard because CI uses the repo-wide check.
- If any file is edited after a formatting/check pass, rerun the relevant Prettier command(s) and rerun `npm run format:check` before finalizing.

Test scope note:

- `tests/api/` is the Vitest suite for backend API e2e coverage.
- `tests/e2e/` is for basic frontend browser smoke tests.
- Do not add frontend/app unit tests to these integration suites.
- In `tests/api/`, prefer shared GraphQL operations from `shared/urql/*` and existing GraphQL test helpers over inline query strings.
- In `tests/e2e/` Playwright smoke tests, keep GraphQL operations local to `tests/e2e/` and avoid importing enums from generated GraphQL type files (`shared/gql/graphql`).
- Local E2E runs use Docker images built from `dist` output artifacts, not live `frontend/src` files.
- Run a fresh local build before E2E when validating frontend code changes (`npm run test:e2e:fresh` is preferred).
- If a change touches Dockerfiles, GitHub Actions build/test steps, backend startup/boot code, `backend/config/*`, or environment variable validation, run `cd backend && npm run build` and `npm run test:api` before declaring success. These changes can pass lint/tsc while still breaking the containerized runtime used in CI.
- For those same CI-sensitive changes, also ask the user to run `npm run workflow` before pushing. `npm run test:api` is the required local reproduction of the risky Dockerized backend path; `npm run workflow` is the final end-to-end CI guard that the user runs manually.

**Do not run `npm run workflow` directly.** Ask the user to run it themselves.
**`npm run test:api` and `npm run test:e2e` may be run by AI locally anytime.**

## Subsystem Boundaries

ESLint enforces that `frontend`, `backend`, and `app` do not import from each other — only from `shared`. The rule uses relative path patterns (`../**/backend/**` etc.) and runs automatically on `npm run lint`.

**The rule has one blind spot:** TypeScript path aliases (e.g. `@shared/*`) are not matched by the relative-path patterns. If you add a new alias to a tsconfig `paths`, ensure it does not point across subsystem boundaries. The `@frontend/*` alias was removed from `app/tsconfig.json` for this reason.

**When moving or deleting a file:** search for references using both `.ts` and `.tsx` extensions, and check for alias-based imports (`@shared/`, `@frontend/`) in addition to relative paths. Always run `npx tsc --noEmit` for each touched subsystem — lint alone is not sufficient.

## Coding Style & Conventions

- **TypeScript-first** - Avoid `any`, use proper types
- **Functional React** - No class components
- **Prettier 3** - Two-space indentation, format before committing
- **ESLint** - React hooks rules, React Compiler compatibility
- **Temporary debugging is allowed** - In this local dev environment, add `console.log`, `console.debug`, backend `log('debug', ...)`, or similarly direct instrumentation when it helps troubleshooting. Remove temporary traces before saying the job is done. `no-console` is declared as a warning, but every lint script uses `--max-warnings=0`, so temporary `console.*` traces must also be removed before `npm run check` can pass. Do not add dev-mode switches, feature flags, or permanent logging just to justify short-lived debugging output.
- **Frontend UI styling** - Prefer Mantine-idiomatic patterns (components, theme tokens, semantic colors) over hardcoded inline CSS values
- **Typed CSS modules** - Prefer `styles.className` dot notation (camelCase class names) and keep generated `*.module.css.d.ts` files in sync/committed via `css:types`

### Naming Conventions

| Type                | Convention  | Example                    |
| ------------------- | ----------- | -------------------------- |
| Components/Types    | PascalCase  | `FolderView`, `UserType`   |
| Functions/Variables | camelCase   | `getUserById`, `isLoading` |
| Files (components)  | PascalCase  | `FolderView.tsx`           |
| Files (utilities)   | camelCase   | `formatDate.ts`            |
| Database models     | db prefix   | `dbUser`, `dbFolder`       |
| GraphQL types       | Type suffix | `userType`, `folderType`   |

## Git & Commit Guidelines

### Upgrade Compatibility Policy

PICR uses major versions as the clear boundary for breaking changes. A release
must support a direct upgrade from any release in the previous major version to
any release in the next major version, unless a release note explicitly declares
a required upgrade stop.

Examples:

- Any `0.x` release must be able to upgrade directly to any `1.x` release.
- Any `1.x` release must be able to upgrade directly to any `2.x` release.

Design migrations around that promise. If a breaking schema or API cleanup is
needed, ship it in the next major version instead of the middle of the current
major. If a migration removes a column/table used by older versions, preserve
any required data before dropping it. Remember that Drizzle SQL migrations run
before `backend/boot/dbMigrate.ts`, so data needed from a dropped column must be
copied in SQL before the `DROP COLUMN`.

Downgrades are allowed only to PICR versions greater than or equal to the
database compatibility floor (`minimumPicrVersion`). If a migration makes older
versions unsafe, raise that floor in the same release. Restoring a backup taken
before the upgrade is required to downgrade below the floor. PostgreSQL
major-version upgrades are separate from PICR app upgrades and require their own
documented database migration path.

### Commit Format

```
<gitmoji> [#issue] [subsystem] <description>

Examples:
🐛 #42 [backend] fix folder rename crash
✨ #43 [frontend] add gallery search
📝 [docs] update installation guide
♻️ [shared] refactor date formatting
```

Common gitmoji:

- ✨ New feature
- 🐛 Bug fix
- ♻️ Refactor
- 📝 Documentation
- 🎨 Style/formatting
- ⚡ Performance
- 🔧 Configuration
- 🚀 Release
- 🌐 Internationalization and localization

### Important Rules

- **Releases**: Must be done by human running `npm run release`, `npm run release:app`, or `npm run release:ping` - AI may only suggest these commands
- **Migrations**: Call out DB migrations, GraphQL schema changes, or new env vars in PR descriptions
- **Codegen**: Run `npm run gql` after schema changes and commit the generated files

## Environment Variables

See `.env.example` for all available variables with documentation. Key ones:

| Variable               | Required | Description                                     |
| ---------------------- | -------- | ----------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                    |
| `BASE_URL`             | Yes      | Server URL ending with `/` (for social sharing) |
| `NODE_ENV`             | No       | `development` \| `test` \| `production`         |
| `FILE_WATCHER`         | No       | `native`, `polling`, or `off` media detection   |
| `POLLING_SECONDS`      | No       | Polling interval in real seconds                |
| `ON_VIEW_SCAN`         | No       | Demand-driven scan mode for viewed folders      |
| `SCHEDULED_SCAN_HOURS` | No       | Whole-library reconcile interval, `0` disables  |
| `PICR_PING_TOKEN`      | No       | Enables authenticated PICR Ping directory hints |

Legacy aliases `USE_POLLING` and `POLLING_INTERVAL` are still accepted in 1.x
but should not be used in new examples.

## Cross-References

- **Database schema**: See `backend/database-erd.md` for entity relationship diagram
- **GraphQL API**: See `schema.graphql` for full API, `backend/AGENTS.md` for patterns
- **Frontend patterns**: See `frontend/AGENTS.md` for React/Mantine/URQL details
- **Shared code**: See `shared/AGENTS.md` for what can/cannot be shared
- **Testing**: See `tests/AGENTS.md` for test patterns and Docker setup
- **Translations**: Before adding a supported web-interface language, follow
  `docs/development/translations.md` for registration, catalog contracts,
  script/font and RTL preflight, browser coverage, fluent review, and release
  requirements
