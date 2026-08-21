const displayNameReplacements: ReadonlyArray<readonly [RegExp, string]> = [
  [/\uF022/g, '/'],
];

export const normalizeDisplayName = (value?: string | null) => {
  if (value == null) return value;

  return displayNameReplacements.reduce(
    (normalized, [pattern, replacement]) =>
      normalized.replace(pattern, replacement),
    value,
  );
};

export interface FolderDisplayIdentity {
  name?: string | null;
  parentId?: string | number | null;
}

export const displayFolderName = (
  folder: FolderDisplayIdentity | null | undefined,
  rootLabel: string,
) => {
  if (!folder) return undefined;

  return normalizeDisplayName(
    folder.parentId === null ? rootLabel : folder.name,
  );
};
