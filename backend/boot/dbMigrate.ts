import { lt, valid } from 'semver';
import { db, getServerOptions, setServerOptions } from '../db/picrDb.js';
import { and, count, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { IPicrConfiguration } from '../config/IPicrConfiguration.js';
import { dirname } from 'path';
import { randomBytes } from 'node:crypto';
import {
  dbAccessLog,
  dbBranding,
  dbComment,
  dbFile,
  dbFolder,
  dbUser,
} from '../db/models/index.js';

// This does the "picr" side of migrations, for the DB side see schemaMigration.ts
export const dbMigrate = async (config: IPicrConfiguration) => {
  const opts = await getServerOptions();

  if (!opts.tokenSecret) {
    if (config.tokenSecret) {
      console.log(
        " ℹ️ Updating token secret in database. You don't need it in .ENV anymore\n",
      );
      await setServerOptions({ tokenSecret: config.tokenSecret });
    } else {
      config.tokenSecret = randomBytes(64).toString('hex');
      await setServerOptions({ tokenSecret: config.tokenSecret });
    }
  } else {
    config.tokenSecret = opts.tokenSecret;
  }

  if (valid(opts.lastBootedVersion)) {
    if (lt(opts.lastBootedVersion!, '0.7.0')) {
      // config.updateMetadata = true;
      await removeDuplicates();
    }
  }

  await setServerOptions({ lastBootedVersion: config.version });
};

const removeDuplicates = async () => {
  console.log('🔂 PICR Migration: cleanup duplicate file and folder entries');
  // NOTE: this runs before FileWatcher has started

  const duplicateFolders = await db
    .select({ count: count(), relativePath: dbFolder.relativePath })
    .from(dbFolder)
    .groupBy(dbFolder.relativePath)
    .having(sql`count(*) > 1`);

  await Promise.all(
    duplicateFolders.map(({ relativePath }) =>
      processDuplicateFolder(relativePath!),
    ),
  );

  //TODO: fix the parentId on each folder (EG: sub-sub-folder has parentId of 1 due to bugs)
  // definitely a 'real issue' not just dev environment shenanigans

  const folders = await db.query.dbFolder.findMany({
    where: isNotNull(dbFolder.parentId),
    columns: { id: true, relativePath: true },
  });

  const fMap: { [key: string]: number } = { '.': 1 };
  folders.forEach(({ id, relativePath }) => (fMap[relativePath!] = id));

  folders.forEach((f) => {
    const parentPath = dirname(f.relativePath!);
    //TODO: set f.id to have parentId of fMap[parentPath]`
    db.update(dbFolder)
      .set({ parentId: fMap[parentPath] })
      .where(eq(dbFolder.id, f.id));
  });

  const duplicateFiles = await db
    .select({
      count: count(),
      relativePath: dbFile.relativePath,
      name: dbFile.name,
    })
    .from(dbFile)
    .groupBy(dbFile.relativePath, dbFile.name)
    .having(sql`count(*) > 1`);

  await Promise.all(
    duplicateFiles.map(({ relativePath, name }) =>
      processDuplicateFile(relativePath!, name!),
    ),
  );

  console.log('🔂 PICR Migration complete');
  // process.exit();
};

const processDuplicateFolder = async (relativePath: string) => {
  const matching = await db.query.dbFolder.findMany({
    where: eq(dbFolder.relativePath, relativePath),
  });
  const firstId = matching.shift()?.id;
  const otherIds = matching.map((id) => id.id);

  console.log('Removing dupes for ' + relativePath, firstId, otherIds);

  await db
    .update(dbAccessLog)
    .set({ folderId: firstId })
    .where(inArray(dbAccessLog.folderId, otherIds));
  await db
    .update(dbBranding)
    .set({ folderId: firstId })
    .where(inArray(dbBranding.folderId, otherIds));
  await db
    .update(dbComment)
    .set({ folderId: firstId })
    .where(inArray(dbComment.folderId, otherIds));
  await db
    .update(dbFile)
    .set({ folderId: firstId })
    .where(inArray(dbFile.folderId, otherIds));
  await db
    .update(dbUser)
    .set({ folderId: firstId })
    .where(inArray(dbUser.folderId, otherIds));
  await db
    .update(dbFolder)
    .set({ parentId: firstId })
    .where(inArray(dbFolder.parentId, otherIds));
  await db.delete(dbFolder).where(inArray(dbFolder.id, otherIds));
};

const processDuplicateFile = async (relativePath: string, name: string) => {
  //NOTE: doesn't merge things like TotalComments count
  const matching = await db.query.dbFile.findMany({
    where: and(eq(dbFile.relativePath, relativePath), eq(dbFile.name, name)),
  });
  const firstId = matching.shift()?.id;
  const otherIds = matching.map((id) => id.id);

  await db
    .update(dbComment)
    .set({ fileId: firstId })
    .where(inArray(dbComment.fileId, otherIds));

  await db
    .update(dbFolder)
    .set({ heroImageId: firstId })
    .where(inArray(dbFolder.heroImageId, otherIds));
  await db.delete(dbFile).where(inArray(dbFile.id, otherIds));
};
