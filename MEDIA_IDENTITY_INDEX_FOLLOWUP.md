# Media Identity Index Follow-Up

## Goal

Add database indexes and later uniqueness constraints for media path identity.
This should improve scan performance and make duplicate live file/folder rows
impossible at the database layer.

## Why This Is Separate

Do **not** add the unique constraints in the same release as the duplicate-row
cleanup. Drizzle SQL migrations run before `backend/boot/dbMigrate.ts`, so a
new unique index would fail on affected installs before the app cleanup can
delete existing duplicate live rows.

Sequence:

1. Ship the app-level cleanup release first.
2. Add non-unique performance indexes whenever they are useful; they are safe
   with duplicate data.
3. In a later release, add partial unique constraints only after handling direct
   upgrades from older versions.

Important: PICR supports direct upgrades within the supported version range. A
self-hoster can skip the cleanup release and upgrade directly to the future
unique-index release. Therefore the future unique-index SQL migration must dedupe
live rows in SQL immediately before creating the unique indexes, or the release
must explicitly declare a required upgrade stop.

## Performance Indexes To Consider

`Files` currently has only `Files_stIno_idx`. PostgreSQL does not automatically
index foreign-key columns, so scanner reads can become sequential scans as the
library grows.

Likely candidates to justify from code/query plans:

- `Files(folderId)` for `scanFolder` direct child reads.
- `Files(relativePath, name)` for path-based lookup/removal and archived-row
  revival checks.
- `Folders(parentId, name)` for child folder scans and folder identity.
- `Folders(relativePath)` for path lookup/reactivation.

Skip speculative indexes. Dropping an unused index later is another migration.
Check actual query plans before finalizing exact shapes.

## Uniqueness Constraints To Add Later

Use partial unique indexes so archived rows remain allowed.

Likely invariants:

- Live files: unique by folder/path identity while `exists = true`.
- Live folders: unique by parent/path identity while `exists = true`.

Important: a partial unique index like `WHERE exists = true` cannot serve every
lookup. `findBestFileMatch()` intentionally searches live and archived rows so
archived rows can be revived. Keep a separate non-partial lookup index for that
path.

Also update write paths before enforcing uniqueness:

- `addFile()` inserts with `exists = false` and flips to `true` at the end, so a
  partial unique index on live files fires on the final `UPDATE`, not the
  initial `INSERT`. On conflict, delete the just-created orphan row and treat the
  existing live row as the winner.
- `addFolder()` should also handle unique violations once folder uniqueness
  exists, even though it is serialized in-process.
- Raise `minimumPicrVersion` in the same release as uniqueness. Downgrading to a
  pre-fix scanner with the unique indexes still present would turn the old race
  into runtime unique-violation errors.

## Release Notes Checklist

When implementing this follow-up:

- Confirm the prior cleanup release has shipped.
- For uniqueness, include SQL dedupe before `CREATE UNIQUE INDEX` or declare a
  required upgrade stop.
- Run duplicate live row queries before and after the migration.
- Add/verify tests for archived twins remaining allowed.
- Add/verify tests for unique-violation recovery in `addFile()` and `addFolder()`.
- Call out the Drizzle SQL migration in the PR/release notes.
- Call out any `minimumPicrVersion` bump in the PR/release notes.
- Ask the user to run `npm run workflow` before pushing/release.
