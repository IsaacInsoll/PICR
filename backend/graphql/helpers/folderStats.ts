import { allSubFoldersRecursive } from '../../helpers/allSubFoldersRecursive';
import FileModel from '../../db/FileModel';
import { sortBy } from 'lodash';
import { pluralize } from '../../../frontend/src/helpers/folderSubtitle';

export const folderStats = async (folderId: number): Promise<FolderStat[]> => {
  const children = await allSubFoldersRecursive(folderId);
  const childIds = children.map(({ id }) => id);
  const result: FolderStat[] = [
    { type: 'Folder', total: childIds.length },
    {
      type: 'Image',
      total: await FileModel.count({
        where: { folderId: childIds, type: 'Image' },
      }),
    },
    {
      type: 'Video',
      total: await FileModel.count({
        where: { folderId: childIds, type: 'Video' },
      }),
    },
    {
      type: 'File',
      total: await FileModel.count({
        where: { folderId: childIds, type: 'File' },
      }),
    },
  ];
  // can't await inside an interator so top level it is

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
  console.log(stats);
  let str = stats
    .filter(({ type, total }) => type != 'Folder' && total > 0)
    .map(({ type, total }) => pluralize(total, type))
    .join(', ');

  const folder = stats.find(({ type }) => type == 'Folder').total;
  if (folder > 1) str += (str != '' ? ' in ' : '') + `${folder} folders`;
  return str;
};
