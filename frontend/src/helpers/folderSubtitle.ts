import type { TFunction } from 'i18next';

export const folderSubtitle = (
  folder: {
    subFolders: Array<unknown>;
    files: Array<unknown>;
  },
  t: TFunction<'gallery'>,
) => {
  const { subFolders, files } = folder;
  if (subFolders.length === 0 && files.length === 0) return t('folder.empty');
  const f = subFolders.length
    ? t('count.folder', { count: subFolders.length })
    : '';
  const fi = files.length ? t('count.file', { count: files.length }) : '';
  const join = f !== '' && fi !== '' ? ', ' : '';
  return `${f}${join}${fi}`;
};
