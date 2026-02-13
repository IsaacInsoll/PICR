import { pluralize } from '@shared/pluralize';

export const folderSubtitle = (folder: {
  subFolders: Array<unknown>;
  files: Array<unknown>;
}) => {
  const { subFolders, files } = folder;
  if (subFolders.length === 0 && files.length === 0) return 'Empty Folder';
  const f = pluralize(subFolders.length, 'Folder');
  const fi = pluralize(files.length, 'File');
  const join = f !== '' && fi !== '' ? ', ' : '';
  return `${f}${join}${fi}`;
};
