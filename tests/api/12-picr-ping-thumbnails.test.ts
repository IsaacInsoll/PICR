import { beforeAll, expect, test } from 'vitest';
import { db, initDb } from '../../backend/db/picrDb.js';
import { dbFile } from '../../backend/db/models/index.js';
import { selectPingThumbnailFileIds } from '../../backend/filesystem/pingScanCoordinator.js';

beforeAll(() => {
  process.env['DATABASE_URL'] = 'postgres://user:pass@localhost:54313/picr';
  initDb();
});

test('selects newly discovered thumbnail work within the exact scan scope', async () => {
  const rollback = new Error('rollback Ping thumbnail selection fixtures');

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
        ])
        .returning({ id: dbFile.id });
      const [siblingOne, siblingTwo, literalPath, lookalikePath, oldFile] =
        inserted.map(({ id }) => id);

      const rootIds = await selectPingThumbnailFileIds(
        '',
        passStartedAt,
        transaction,
      );
      expect(rootIds).toEqual(
        expect.arrayContaining([
          siblingOne,
          siblingTwo,
          literalPath,
          lookalikePath,
        ]),
      );
      expect(rootIds).not.toContain(oldFile);

      await expect(
        selectPingThumbnailFileIds(
          'Ping Tests/Parent',
          passStartedAt,
          transaction,
        ),
      ).resolves.toEqual(expect.arrayContaining([siblingOne, siblingTwo]));

      const literalScopeIds = await selectPingThumbnailFileIds(
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
