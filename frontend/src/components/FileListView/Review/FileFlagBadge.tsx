import { FileFlag } from '../../../../../graphql-types';
import { Badge } from '@mantine/core';

interface FileFlagBadgeProps {
  flag: FileFlag;
  hideIfNone?: boolean;
}

// A read-only representation of the current badge
export const FileFlagBadge = ({ flag, hideIfNone }: FileFlagBadgeProps) => {
  if (hideIfNone && (!flag || flag == FileFlag.None)) return null;
  return (
    <Badge color={fileFlagColors[flag]} variant="filled" size="xs">
      {flag}
    </Badge>
  );
};

const fileFlagColors: { [key in FileFlag]: string } = {
  [FileFlag.Approved]: 'green',
  [FileFlag.Rejected]: 'red',
  [FileFlag.None]: 'gray',
};
