import { beforeAll, expect, test } from 'vitest';
import { db, initDb } from '../../backend/db/picrDb.js';
import { dbFile } from '../../backend/db/models/index.js';
import { selectScanThumbnailFileIds } from '../../backend/filesystem/scanThumbnails.js';

beforeAll(() => {
  process.env['DATABASE_URL'] = 'postgres://user:pass@localhost:54313/picr';
  initDb();
});

test('selects newly discovered thumbnail work within the exact scan scope', async () => {
  const rollback = new Error('rollback scan thumbnail selection fixtures');

  await expect(
    db.transaction(async (transaction) => {
      const now = new Date();
      const passStartedAt = new Date(now.getTime() - 1_000);
      const oldTimestamp = new Date(passStartedAt.getTime() - 1_000);
      const common = {
        createdAt: now,
        exists: true,
        existsRescan: true,
        fileCreated: now,
        fileLastModified: now,
        fileSize: 1,
        folderId: 1,
        rating: 0,
        totalComments: 0,
        type: 'Image' as const,
      };
      const inserted = await transaction
        .insert(dbFile)
        .values([
          {
            ...common,
            name: 'ping-sibling-one.jpg',
            relativePath: 'Ping Tests/Parent/One',
            updatedAt: now,
          },
          {
            ...common,
            name: 'ping-sibling-two.jpg',
            relativePath: 'Ping Tests/Parent/Two',
            updatedAt: now,
          },
          {
            ...common,
            name: 'ping-sibling-prefix.jpg',
            relativePath: 'Ping Tests/Parent-old',
            updatedAt: now,
          },
          {
            ...common,
            name: 'ping-literal-path.jpg',
            relativePath: 'Ping Tests/50%_off/Child',
            updatedAt: now,
          },
          {
            ...common,
            name: 'ping-lookalike-path.jpg',
            relativePath: 'Ping Tests/50XXoff/Child',
            updatedAt: now,
          },
          {
            ...common,
            name: 'ping-old-file.jpg',
            relativePath: 'Ping Tests/50%_off/Old',
            updatedAt: oldTimestamp,
          },
          {
            ...common,
            exists: false,
            name: 'ping-archived-file.jpg',
            relativePath: 'Ping Tests/Parent/Archived',
            updatedAt: now,
          },
        ])
        .returning({ id: dbFile.id });
      const [
        siblingOne,
        siblingTwo,
        siblingPrefix,
        literalPath,
        lookalikePath,
        oldFile,
        archivedFile,
      ] = inserted.map(({ id }) => id);

      const rootIds = await selectScanThumbnailFileIds(
        '',
        passStartedAt,
        transaction,
      );
      expect(rootIds).toEqual(
        expect.arrayContaining([
          siblingOne,
          siblingTwo,
          siblingPrefix,
          literalPath,
          lookalikePath,
        ]),
      );
      expect(rootIds).not.toContain(oldFile);
      expect(rootIds).not.toContain(archivedFile);

      const parentIds = await selectScanThumbnailFileIds(
        'Ping Tests/Parent',
        passStartedAt,
        transaction,
      );
      expect(parentIds).toEqual(
        expect.arrayContaining([siblingOne, siblingTwo]),
      );
      expect(parentIds).not.toContain(siblingPrefix);
      expect(parentIds).not.toContain(archivedFile);

      const literalScopeIds = await selectScanThumbnailFileIds(
        'Ping Tests/50%_off',
        passStartedAt,
        transaction,
      );
      expect(literalScopeIds).toContain(literalPath);
      expect(literalScopeIds).not.toContain(lookalikePath);
      expect(literalScopeIds).not.toContain(oldFile);

      throw rollback;
    }),
  ).rejects.toBe(rollback);
});
