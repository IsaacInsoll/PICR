import type { PicrFolder } from '@shared/types/picr';

const maxVisibleBreadcrumbFolders = 3;

export const getBreadcrumbFolders = (parents?: PicrFolder[]): PicrFolder[] => {
  if (!parents?.length) return [];

  return parents
    .map((folder, index) => ({
      ...folder,
      parents: parents.slice(index + 1),
    }))
    .slice(0, maxVisibleBreadcrumbFolders)
    .reverse();
};
