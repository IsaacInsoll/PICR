import { sql, type SQLWrapper } from 'drizzle-orm';
import { dbFile } from '../db/models/index.js';
import { normalizeSearchText } from '@shared/files/mediaCriteria.js';

// PostgreSQL evaluates every assignment against the pre-update row. That lets
// us replace the source and normalized prefixes together while proving the
// derived value was current first. Legacy/stale rows are left null so the
// self-discovering post-boot backfill can repair them instead of blessing an
// incorrect normalized path with a current source marker.
export const folderRenameFileUpdates = (
  oldRelativePath: string,
  newRelativePath: string,
) => {
  const { normalizedOldPath, normalizedNewPath } = folderRenamePathPrefixes(
    oldRelativePath,
    newRelativePath,
  );
  const nextRelativePath = folderRenamePathUpdate(
    dbFile.relativePath,
    oldRelativePath,
    newRelativePath,
  );
  const derivedPathIsCurrent = sql<boolean>`${dbFile.normalizedRelativePathSource} = ${dbFile.relativePath} AND ${dbFile.normalizedRelativePath} IS NOT NULL`;

  return {
    relativePath: nextRelativePath,
    normalizedRelativePath: sql<
      string | null
    >`CASE WHEN ${derivedPathIsCurrent} THEN ${normalizedNewPath} || SUBSTRING(${dbFile.normalizedRelativePath} FROM CHAR_LENGTH(${normalizedOldPath}) + 1) ELSE NULL END`,
    normalizedRelativePathSource: sql<
      string | null
    >`CASE WHEN ${derivedPathIsCurrent} THEN ${nextRelativePath} ELSE NULL END`,
  };
};

export const folderRenamePathUpdate = (
  pathColumn: SQLWrapper,
  oldRelativePath: string,
  newRelativePath: string,
) =>
  sql<string>`${newRelativePath} || SUBSTRING(${pathColumn} FROM CHAR_LENGTH(${oldRelativePath}) + 1)`;

export const folderRenamePathPrefixes = (
  oldRelativePath: string,
  newRelativePath: string,
) => ({
  normalizedOldPath: normalizeSearchText(oldRelativePath),
  normalizedNewPath: normalizeSearchText(newRelativePath),
});
