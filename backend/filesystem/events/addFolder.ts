import { folderList, pathSplit, relativePath } from '../fileManager';
import FolderModel from '../../db/sequelize/FolderModel';
import { updateFolderHash } from './updateFolderHash';
import { log } from '../../logger';
import { sep } from 'path';
import { db } from '../../server';
import { eq } from 'drizzle-orm';
import { folderTable } from '../../db/models';
import { DBFolder } from '../../db/picrDb';
import { folderType } from '../../graphql/types/folderType';

let rootFolder: DBFolder | null = null;

export const setupRootFolder = async () => {
  let root: DBFolder | undefined = await db.query.folderTable.findFirst({
    where: (f, { isNull }) => isNull(f.parentId),
  });
  if (!root) {
    db.insert(folderTable)
      .values({
        parentId: null,
        name: 'Home',
        exists: true,
        updatedAt: new Date(),
      })
      .returning()
      .then((l) => (root = l[0]));
  }

  rootFolder = root;
  return root;
};

export const addFolder = async (path: string) => {
  const relative = relativePath(path);
  const root = rootFolder;
  if (relative === '') return root;

  let f = root.id;
  const ps = pathSplit(path);
  for (let i = 0; i < ps.length; i++) {
    const p = ps.slice(0, i + 1).join(sep);

    let newFolder: DBFolder = await db.query.folderTable.findFirst({
      where: (table, { eq }) => {
        eq(table.name, ps[i]) &&
          eq(table.parentId, f) &&
          eq(table.relativePath, p);
      },
    });

    if (!newFolder) {
      const n = await db
        .insert(folderTable)
        .values({ name: ps[i], parentId: f, relativePath: p, exists: true })
        .returning();
      newFolder = n[0];
    } else if (!newFolder.exists) {
      await db
        .update(folderTable)
        .set({ exists: true })
        .where(eq(folderTable.id, newFolder.id));
    }

    folderList[p] = newFolder.id; // for caching
    updateFolderHash(newFolder);
    f = newFolder.id;
    log('info', `📁➕ ${relativePath(path)}`);
  }
  // console.log('finished addFolder: ' + path);

  return f;
};
