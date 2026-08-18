const pluralizeEnglish = (count: number, noun: string): string =>
  count > 0 ? `${count} ${noun}${count === 1 ? '' : 's'}` : '';

export const folderSubtitle = (folder: {
  subFolders: unknown[];
  files: unknown[];
}) => {
  const { subFolders, files } = folder;
  if (subFolders.length === 0 && files.length === 0) return 'Empty Folder';
  const f = pluralizeEnglish(subFolders.length, 'Folder');
  const fi = pluralizeEnglish(files.length, 'File');
  const join = f !== '' && fi !== '' ? ', ' : '';
  return `${f}${join}${fi}`;
};
