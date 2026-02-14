const hasControlChars = (value: string) =>
  [...value].some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || code === 127;
  });

export const validateFolderName = (name: string) => {
  if (name.length === 0) return 'Folder name is required.';
  if (name.includes('/')) return 'Folder names cannot contain "/".';
  if (name.includes('\\')) return 'Folder names cannot contain "\\".';
  if (name === '.' || name === '..') return 'Folder name is invalid.';
  if (hasControlChars(name)) return 'Folder name is invalid.';
  return null;
};

export const validateRelativePath = (
  value: string,
  options?: { requireNonEmpty?: boolean },
) => {
  const requireNonEmpty = options?.requireNonEmpty ?? false;
  if (!value) return requireNonEmpty ? 'New name invalid' : null;
  if (value.startsWith('/') || value.endsWith('/')) return 'New name invalid';
  if (value.includes('\\')) return 'New name invalid';
  if (hasControlChars(value)) return 'New name invalid';
  const segments = value.split('/');
  if (segments.some((segment) => segment.length === 0)) {
    return 'New name invalid';
  }
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return 'New name invalid';
  }
  return null;
};
