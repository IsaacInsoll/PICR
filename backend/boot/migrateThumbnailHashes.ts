import { and, asc, count, eq, gt, isNotNull, ne } from 'drizzle-orm';
import { lt, valid } from 'semver';
import { promises as fs } from 'node:fs';
import { db } from '../db/picrDb.js';
import { dbFile } from '../db/models/index.js';
import { contentHashForDb } from '../filesystem/fileHash.js';
import { thumbnailVariantPaths } from '../media/thumbnailVariants.js';
import { moveEntryNoOverwrite } from '../media/moveThumbnailFile.js';
import { log } from '../logger.js';

// MUST equal the release version that ships this migration. On first boot of that
// release, every install last booted on an older version runs the migration once,
// then `lastBootedVersion` advances past it and it never runs again. If this does
// not match the released version, the migration will either never run or re-run
// every boot.
export const THUMBNAIL_HASH_MIGRATION_VERSION = '1.1.0';

const BATCH_SIZE = 1000;

interface MigrationTotals {
  files: number;
  migrated: number;
  skipped: number;
  superseded: number;
  moved: number;
  alreadyMoved: number;
  missing: number;
  conflict: number;
  failed: number;
}

const liveHashedFiles = and(
  eq(dbFile.exists, true),
  isNotNull(dbFile.fileHash),
  ne(dbFile.fileHash, ''),
);

const cacheEntryExists = async (path: string): Promise<boolean> => {
  try {
    await fs.stat(path);
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw err;
  }
};

const filesAreEqual = async (a: string, b: string): Promise<boolean> => {
  const [bufA, bufB] = await Promise.all([fs.readFile(a), fs.readFile(b)]);
  return bufA.equals(bufB);
};

/**
 * Resolve a migration conflict (both the old-hash source and the new-hash
 * destination exist) non-destructively, keeping the authoritative old source.
 * If the destination already equals the source, keep it — the source becomes an
 * orphan for the Release B sweep. Otherwise move the differing destination aside
 * to a quarantine name (which thumbnail serving never matches) and move the
 * source into its place. Never deletes cache data.
 *
 * This must always leave the destination holding the source's content, because
 * the DB row is advanced to the new hash afterwards regardless — leaving a row on
 * the old hash does not stick (the boot scan re-derives the content hash and
 * advances it anyway).
 */
const resolveConflict = async (
  from: string,
  to: string,
  isDir: boolean,
  tag: string,
  totals: MigrationTotals,
): Promise<void> => {
  if (!isDir && (await filesAreEqual(from, to))) return; // dest already correct
  await fs.rename(to, `${to}.superseded-${tag}-${Date.now()}`);
  await moveEntryNoOverwrite(from, to, isDir);
  totals.superseded++;
  log(
    'warn',
    `⚠️ Superseded a differing cached thumbnail during migration (${to}); moved aside for inspection.`,
    true,
  );
};

const hasThumbnailsToMigrate = async (): Promise<boolean> => {
  const row = await db.query.dbFile.findFirst({
    where: liveHashedFiles,
    columns: { id: true },
  });
  return !!row;
};

/**
 * Version-gated entry point (called from dbMigrate). Runs the migration when the
 * last booted version predates this release, or — for old DBs with a
 * missing/invalid version but existing media — when there is anything to migrate.
 * Fresh installs (no files) skip.
 */
export const runThumbnailHashMigrationIfNeeded = async (
  lastBootedVersion: string | null,
): Promise<void> => {
  let needed: boolean;
  if (lastBootedVersion && valid(lastBootedVersion)) {
    needed = lt(lastBootedVersion, THUMBNAIL_HASH_MIGRATION_VERSION);
  } else {
    needed = await hasThumbnailsToMigrate();
  }
  if (needed) await migrateThumbnailHashes();
};

/**
 * One-time migration: rename every existing thumbnail from its old (path-based)
 * hash to the new content-stable hash. Renames only — no re-encoding. Runs
 * blocking, before the file watcher starts, so nothing recomputes hashes
 * mid-flight. Works from DB-known metadata (fileSize + fileLastModified): if a
 * file changed while offline the boot scan supersedes this row afterwards.
 * Does not discard cache data: it moves/renames entries (removing a source only
 * once its destination exists) and may replace an empty destination directory,
 * but never overwrites existing thumbnails.
 */
export const migrateThumbnailHashes = async (): Promise<void> => {
  const startedAt = Date.now();
  const totals: MigrationTotals = {
    files: 0,
    migrated: 0,
    skipped: 0,
    superseded: 0,
    moved: 0,
    alreadyMoved: 0,
    missing: 0,
    conflict: 0,
    failed: 0,
  };

  const [{ total }] = await db
    .select({ total: count() })
    .from(dbFile)
    .where(liveHashedFiles);

  log(
    'info',
    `🔀 Migrating thumbnails to content-stable hashes (from DB-known metadata) for ${total} files…`,
    true,
  );

  let lastId = 0;
  let processed = 0;
  for (;;) {
    const rows = await db.query.dbFile.findMany({
      where: and(gt(dbFile.id, lastId), liveHashedFiles),
      orderBy: asc(dbFile.id),
      limit: BATCH_SIZE,
      columns: {
        id: true,
        fileHash: true,
        relativePath: true,
        name: true,
        type: true,
        fileSize: true,
        fileLastModified: true,
      },
    });
    if (rows.length === 0) break;

    for (const row of rows) {
      totals.files++;
      const oldHash = row.fileHash;
      if (!oldHash) continue;
      // fileSize/fileLastModified are NOT NULL, so this cannot throw.
      const newHash = contentHashForDb(row.fileSize, row.fileLastModified);
      if (newHash === oldHash) {
        totals.skipped++;
        continue;
      }

      const sources = thumbnailVariantPaths(
        row.relativePath,
        row.name,
        oldHash,
        row.type,
      );
      const dests = thumbnailVariantPaths(
        row.relativePath,
        row.name,
        newHash,
        row.type,
      );

      for (let i = 0; i < sources.length; i++) {
        const from = sources[i].path;
        const to = dests[i].path;
        const isDir = sources[i].isDirectory;
        // Contain per-variant filesystem failures: a single unmovable/anomalous
        // cache entry must never throw out of this blocking boot migration and
        // take the server down. A skipped variant simply regenerates later under
        // the new hash; the row is still advanced below so the file becomes
        // path-independent regardless.
        try {
          const [srcExists, dstExists] = await Promise.all([
            cacheEntryExists(from),
            cacheEntryExists(to),
          ]);

          if (!srcExists && !dstExists) {
            totals.missing++;
          } else if (!srcExists && dstExists) {
            totals.alreadyMoved++;
          } else if (srcExists && !dstExists) {
            const outcome = await moveEntryNoOverwrite(from, to, isDir);
            if (outcome === 'moved') {
              totals.moved++;
            } else {
              // Destination appeared (not expected while single-threaded);
              // resolve it like any other conflict.
              totals.conflict++;
              await resolveConflict(from, to, isDir, `${row.id}-${i}`, totals);
            }
          } else {
            // Both the old-hash source and the new-hash destination exist. The
            // old source is authoritative; make it win non-destructively.
            totals.conflict++;
            await resolveConflict(from, to, isDir, `${row.id}-${i}`, totals);
          }
        } catch (variantErr) {
          totals.failed++;
          const message =
            variantErr instanceof Error
              ? variantErr.message
              : String(variantErr);
          log(
            'warn',
            `⚠️ Could not migrate cache variant ${from} -> ${to} (id ${row.id}); it will regenerate: ${message}`,
            true,
          );
        }
      }

      // Advance to the content-stable hash even if some variants failed to move —
      // the file is path-independent from here on and any variant we couldn't move
      // regenerates lazily at the new hash. This DB write is deliberately NOT
      // wrapped in a catch: a write failure propagates and aborts the migration so
      // lastBootedVersion does not advance and the whole run retries on the next
      // boot (idempotently — completed rows skip on `newHash === oldHash`), rather
      // than silently marking the migration done with rows left on the old hash.
      await db
        .update(dbFile)
        .set({ fileHash: newHash })
        .where(eq(dbFile.id, row.id));
      totals.migrated++;
    }

    processed += rows.length;
    lastId = rows[rows.length - 1].id;
    const pct = total > 0 ? Math.round((processed / total) * 100) : 100;
    const elapsed = (Date.now() - startedAt) / 1000;
    const eta = processed > 0 ? elapsed * (total / processed - 1) : 0;
    log(
      'info',
      `   … ${processed} / ${total} (${pct}%) — elapsed ${elapsed.toFixed(0)}s, eta ~${eta.toFixed(0)}s ` +
        `[moved ${totals.moved} · alreadyMoved ${totals.alreadyMoved} · missing ${totals.missing} · conflict ${totals.conflict} · failed ${totals.failed}]`,
      true,
    );
  }

  const elapsed = (Date.now() - startedAt) / 1000;
  log(
    'info',
    `✅ Thumbnail hash migration complete: ${totals.migrated} migrated, ${totals.skipped} already current` +
      (totals.superseded
        ? `, ${totals.superseded} conflicting destinations superseded`
        : '') +
      (totals.failed ? `, ${totals.failed} skipped after errors` : '') +
      ` in ${elapsed.toFixed(1)}s — moved=${totals.moved} alreadyMoved=${totals.alreadyMoved} missing=${totals.missing} conflict=${totals.conflict} failed=${totals.failed}`,
    true,
  );
};
