export const folderSubtitle = (folder: { subFolders: any[]; files: any[] }) => {
  const { subFolders, files } = folder;
  if (subFolders.length === 0 && files.length === 0) return 'Empty Folder';
  const f = pluralize(subFolders.length, 'Folder');
  const fi = pluralize(files.length, 'File');
  const join = f !== '' && fi !== '' ? ', ' : '';
  return `${f}${join}${fi}`;
};

export const pluralize = (num: number, title: string) => {
  if (num === 0) return '';
  return `${num} ${title}${num > 1 ? 's' : ''}`;
};
