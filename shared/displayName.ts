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
