// Anything in root starting with '.', any nested dot file/folder, Synology
// @eaDir metadata, and common OS thumbnail database files.
export const ignoredPathPattern = /(^\.|\/\.|@eaDir|desktop.ini|Thumbs.db)/;

export const isIgnoredPath = (path: string): boolean =>
  ignoredPathPattern.test(path);
