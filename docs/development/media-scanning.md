# Media Scanning

PICR keeps the gallery fast by serving folder views from Postgres and the local
thumbnail cache. Filesystem scans are background reconciliation work: they should
not block gallery responses.

## Detection Modes

`FILE_WATCHER` controls continuous filesystem detection:

| Mode      | Behavior                                                              |
| --------- | --------------------------------------------------------------------- |
| `native`  | Chokidar native OS watching. Best for local disks.                    |
| `polling` | Chokidar stat polling. Useful for Docker/NAS/network mounts.          |
| `off`     | No continuous watcher. Use boot, manual, on-view, or scheduled scans. |

Legacy `USE_POLLING=true` still maps to `FILE_WATCHER=polling` in 1.x. New
examples should use `FILE_WATCHER`.

`POLLING_SECONDS` controls both chokidar `interval` and `binaryInterval` when
`FILE_WATCHER=polling`. Legacy `POLLING_INTERVAL` is still accepted in 1.x and
is converted from old 100ms units (`POLLING_INTERVAL=300` becomes
`POLLING_SECONDS=30`). PICR intentionally no longer applies chokidar's hidden
3x binary-file delay.

## PICR Ping

[PICR Ping](../picr-ping.md) is an external realtime trigger for deployments
where the media lives on a NAS and PICR reads it through a network mount. It is
orthogonal to `FILE_WATCHER`: both can run during migration, while the intended
steady-state pairing is:

```text
FILE_WATCHER=off
ON_VIEW_SCAN=off
SCHEDULED_SCAN_HOURS=12
PICR_PING_TOKEN=<shared infrastructure token>
```

Ping sends media-root-relative directory hints, never raw Chokidar events or
remote `Stats`. The server validates those paths, resolves them to database
folders, and funnels them through `scanFolder`. A coordinator adds the behavior
that a one-shot caller would otherwise miss:

- ancestor/descendant job coalescing and scoped recursive overflow reconciles;
- repeated discovery passes for fresh or large unsettled files;
- discovery with `removeMissing: false` before scoped cleanup, improving
  cross-folder move detection;
- metadata-first imports followed by queued thumbnail generation;
- request-local degraded backoff and requeueing so an accepted hint is not
  silently lost while fresh unrelated hints continue immediately.

Two-phase cleanup is best-effort rather than a global scanner transaction.
Manual, scheduled, or on-view scans can still interleave and archive a move
candidate. `ON_VIEW_SCAN=off` is therefore the cleanest Ping pairing. Move
identity also depends on the underlying scanner: cross-folder file moves and
folder renames require stable inode hints, while same-folder file renames can
fall back to a unique size/mtime signature.

Ping uses `ignoreInitial: true`, so its initial tree walk establishes watches
without sending one hint per existing file. That suppresses events rather than
work—the NAS still pays for a directory/stat walk at every Ping start. A scoped
startup reconcile covers changes made while Ping was down or during the initial
walk. The scheduled scan remains the durable backstop because Ping's ordinary
delivery queue is in memory.

## Boot Behavior

Boot reconciliation depends on watcher mode:

- `native` / `polling`: chokidar's initial emit is the boot reconcile. This
  preserves the historical startup path and avoids a second tree walk.
- `off`: PICR runs `scanFolderTree(root)` once at boot, then marks filesystem
  initialization complete.

Boot scans use `generateThumbs: false`. They import metadata and file records but
do not pre-warm the full thumbnail cache.

If the `off` boot scan throws, PICR logs the failure and still serves the
existing database state. This prevents a transient NAS failure from crash-looping
the container.

## On-View Scanning

`ON_VIEW_SCAN` enables stale-while-revalidate scans when a folder is viewed:

| Mode             | Behavior                                                       |
| ---------------- | -------------------------------------------------------------- |
| `off`            | Disabled.                                                      |
| `direct`         | Scan only the viewed folder.                                   |
| `direct_and_new` | Scan the viewed folder and newly discovered direct subfolders. |
| `one_level`      | Scan the viewed folder and all direct subfolders.              |

Root/Home (`folderId=1`) is always direct-only, even when the configured mode is
`direct_and_new` or `one_level`, to avoid accidentally walking the whole library.

The GraphQL `folder` resolver records viewed folder IDs on
`PicrRequestContext.scanFolderIds`. The Express GraphQL wrapper drains that set
from `res.on('finish')`, so the client response is sent before filesystem work
starts. Do not move on-view scanning into the resolver itself.

On-view scans:

- use `generateThumbs: true`;
- have a per-folder in-memory cooldown (`ON_VIEW_SCAN_COOLDOWN_MS`, currently
  60 seconds), intentionally longer than the frontend folder-view refresh
  interval;
- coalesce concurrent scans for the same folder;
- log and swallow background errors so unhandled rejections do not terminate the
  process.

## Scheduled Scanning

`SCHEDULED_SCAN_HOURS` enables an in-process whole-library reconcile every N
hours. `0` disables it.

Scheduled scans:

- run `scanFolderTree(root)` with `generateThumbs: false`;
- skip a tick if a previous scheduled scan is still running;
- catch and log failures, then allow later ticks to run;
- queue thumbnail generation only when the scheduled run's new-file count is at
  or below `SCHEDULED_SCAN_THUMB_LIMIT` (currently 5000).

Large scheduled deltas are metadata-only. Their thumbnails are generated later
by on-view scans or the manual thumbnail-generation mutation.

## Manual Scans

The admin `rescanFolder(folderId)` mutation runs the same recursive scan
foundation for a chosen folder and uses `generateThumbs: true`. The frontend
"Scan now" button calls this mutation.

Manual scans are the endpoint to use for external cron or maintenance scripts if
a self-hoster wants wall-clock scheduling instead of PICR's simple in-process
interval.

## Scanner Safety Rules

`scanFolder` and `scanFolderTree` are the shared reconciliation primitives.
Important invariants:

- File imports are serialized per absolute file path inside `addFile()`. Keep
  that lock around the read-then-insert path: boot, scheduled, manual, on-view,
  and watcher work can overlap, and the `Files` table does not currently have a
  uniqueness constraint for live path identity.
- Folder scans are serialized per `folderId` inside `scanFolder()`, not only at
  the caller layer. This matters because an on-view scan of a parent can recurse
  into a pending new child folder while a direct on-view scan of that child is
  also requested by frontend polling.
- Folder creation/reactivation is serialized per relative folder path inside
  `addFolder()`. File imports can discover missing parent folders independently,
  so the folder lock must live inside `addFolder()` rather than only in scanner
  callers.
- File removal archives every live row matching `(relativePath, name)`. Do not
  derive and add a `folderId` predicate there: duplicate folder rows can split
  files across IDs, while `relativePath` already identifies the folder path.
- Recursive scans carry a visited-folder set. If corrupt folder parentage
  creates a cycle, the scanner logs a warning and skips the repeated folder
  instead of waiting on its own per-folder lock forever.
- The global `handleInitComplete` sweep (marks everything with
  `existsRescan=false` as gone) runs **only** in `native`/`polling` mode after
  chokidar's `ready`. `scanFolder`/`scanFolderTree` never call it — they
  reconcile missing rows via **scoped per-folder** removal. Calling
  `handleInitComplete` from any scoped or whole-tree scan would archive the
  entire library outside the scanned scope.
- Missing files/folders are handled after move detection, so moved rows can keep
  their identity where possible.
- The scanner uses the shared ignored-path rules for dotfiles, Synology `@eaDir`,
  `desktop.ini`, and `Thumbs.db`.
- New large or fresh files must prove stability across scans before import.
  "Large" means at or above `SCAN_FASTPATH_MAX_BYTES` (~5 MB); such files always
  require two-scan stability, guarding against partially-copied RAW/video over
  SMB. Small files can fast-path only when their mtime is older than
  `SCAN_SETTLE_SECONDS`.
- Newly discovered folders can stay pending so a parent scan keeps descending
  until unsettled children settle or the pending-folder TTL expires.
- A single unreadable entry does not abort the scan. Non-`ENOENT` filesystem
  errors (`EACCES`, `EIO`, `ESTALE`, `ELOOP`, …) are logged and skipped: the
  entry is counted in `ScanFolderResult.skippedEntries`, its DB row is **not**
  archived (it is present on disk, we just could not stat it this pass), and the
  scan keeps processing siblings. An unreadable folder (`readdir` failure)
  increments `unavailableFolders` and short-circuits that folder without
  archiving its children. `unavailableFolders` blocks recursive completion;
  `skippedEntries` remains diagnostic because the unreadable-name guard safely
  isolates individual entries. Errors with no filesystem `code` still throw,
  since they indicate a real bug.

## Move Detection

Path identity wins. If a file/folder still exists at the same DB path, the row is
refreshed in place and its stored inode hint is updated.

For new paths, the scanner tries to identify moves:

1. inode hint (`stIno`) with a single live DB candidate whose old path is gone;
2. same-folder content-hash fallback for files.

Folder moves use the inode hint only; there is no content-hash fallback for
folders.

Inodes are hints, not durable identity. This keeps copied media + copied DB
portable across machines where every inode changes. Filesystems that report no
usable inodes degrade to path and hash behavior.

## Thumbnail Behavior

Thumbnail generation depends on scan type:

| Scan type | `generateThumbs` behavior                                                   |
| --------- | --------------------------------------------------------------------------- |
| Boot      | `false`; metadata-only startup.                                             |
| On-view   | `true`; active gallery gets thumbnails as files appear.                     |
| Manual    | `true`; admin explicitly asked to scan/pre-warm.                            |
| Scheduled | metadata first, then queue thumbnails only for small new-file batches.      |
| Ping      | metadata first, then queue thumbnails for rows touched below the scan root. |

Thumbnail generation itself is idempotent: existing thumbnail files are skipped
by the thumbnail helpers.

## Known Caveats

- Unreadable entries/folders are logged and skipped rather than aborting the
  walk (see Scanner Safety Rules). A persistently unreadable file therefore stays
  in the database and is re-attempted on every scan until it becomes readable or
  is genuinely removed; the per-scan `skippedEntries` count surfaces how many
  were skipped.
- `lastScanStartedAt` for on-view cooldown is process-local and bounded by the
  number of distinct folders viewed while PICR is running.
- The scheduled thumbnail-delta query uses `createdAt >= scanStartedAt`; rare
  concurrent inserts can queue a few extra thumbnail jobs. Queue coalescing and
  idempotent thumbnail generation make this harmless.
