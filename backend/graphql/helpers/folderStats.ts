import { allSubfolders } from '../../helpers/allSubfolders';
import { sortBy } from 'lodash';
import { pluralize } from '../../../frontend/src/helpers/folderSubtitle';
import { db } from '../../db/picrDb';
import { and, count, eq, inArray } from 'drizzle-orm';
import { dbFile } from '../../db/models';

export const folderStats = async (folderId: number): Promise<FolderStat[]> => {
  const children = await allSubfolders(folderId);
  const folderIds = children.map(({ id }) => id);

  //TODO: This could be one query :/
  const image = await db
    .select({ count: count() })
    .from(dbFile)
    .where(
      and(
        inArray(dbFile.folderId, folderIds),
        eq(dbFile.exists, true),
        eq(dbFile.type, 'Image'),
      ),
    );
  const video = await db
    .select({ count: count() })
    .from(dbFile)
    .where(
      and(
        inArray(dbFile.folderId, folderIds),
        eq(dbFile.exists, true),
        eq(dbFile.type, 'Video'),
      ),
    );
  const file = await db
    .select({ count: count() })
    .from(dbFile)
    .where(
      and(
        inArray(dbFile.folderId, folderIds),
        eq(dbFile.exists, true),
        eq(dbFile.type, 'File'),
      ),
    );
  //return total[0].count;

  const result: FolderStat[] = [
    { type: 'Folder', total: folderIds.length },
    { type: 'Image', total: image[0].count },
    { type: 'Video', total: video[0].count },
    { type: 'File', total: file[0].count },
  ];
  // can't await inside an iterator so top level it is

  // Object.values(FileType).forEach((t) => {
  //   result[t] = await File.count({ where: { folderId: childIds, type: t } });
  // });
  return sortBy(result, 'total').reverse();
};

interface FolderStat {
  type: string;
  total: number;
}

export const folderStatsSummaryText = async (folderId: number) => {
  const stats = await folderStats(folderId);
  let str = stats
    .filter(({ type, total }) => type != 'Folder' && total > 0)
    .map(({ type, total }) => pluralize(total, type))
    .join(', ');

  const folder = stats.find(({ type }) => type == 'Folder')?.total;
  if (folder && folder > 1)
    str += (str != '' ? ' in ' : '') + `${folder} folders`;
  return str;
};
