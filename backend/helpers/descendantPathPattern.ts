// PostgreSQL LIKE treats `%` and `_` as wildcards and `\` as its default escape
// character. Folder names can legitimately contain all three, so a relative path
// must be escaped before it becomes a prefix pattern. Unescaped, the pattern
// `Smith_Wedding/%` also matches `Smith-Wedding/...`, which widens every subtree
// query (and therefore a public link's visible scope) to unrelated siblings.
export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, '\\$&');

// LIKE pattern matching every path strictly beneath `relativePath`.
export const descendantPathPattern = (relativePath: string): string =>
  `${escapeLikePattern(relativePath)}/%`;
