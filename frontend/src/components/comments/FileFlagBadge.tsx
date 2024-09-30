import { FileFlag } from '../../../../graphql-types';
import { Badge, Chip } from '@mantine/core';

export const FileFlagBadge = ({ flag }: { flag: FileFlag }) => {
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
