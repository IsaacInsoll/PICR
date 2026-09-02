const hasControlChars = (value: string) =>
  [...value].some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || code === 127;
  });

export type FolderNameValidationError =
  'required' | 'forwardSlash' | 'backslash' | 'invalid';

export const validateFolderNameCode = (
  name: string,
): FolderNameValidationError | null => {
  if (name.length === 0) return 'required';
  if (name.includes('/')) return 'forwardSlash';
  if (name.includes('\\')) return 'backslash';
  if (name === '.' || name === '..') return 'invalid';
  if (hasControlChars(name)) return 'invalid';
  return null;
};

const folderNameValidationMessages: Record<FolderNameValidationError, string> =
  {
    required: 'Folder name is required.',
    forwardSlash: 'Folder names cannot contain "/".',
    backslash: 'Folder names cannot contain "\\".',
    invalid: 'Folder name is invalid.',
  };

export const validateFolderName = (name: string) => {
  const code = validateFolderNameCode(name);
  return code ? folderNameValidationMessages[code] : null;
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
