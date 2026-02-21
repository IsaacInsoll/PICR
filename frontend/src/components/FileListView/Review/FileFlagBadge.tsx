import { FileFlag } from '../../../../../graphql-types';
import { Badge } from '@mantine/core';
import { fileFlagStyles } from './fileFlagStyles';

interface FileFlagBadgeProps {
  flag?: FileFlag | null;
  hideIfNone?: boolean;
}

// A read-only representation of the current badge
export const FileFlagBadge = ({ flag, hideIfNone }: FileFlagBadgeProps) => {
  if (hideIfNone && (!flag || flag == FileFlag.None)) return null;
  if (!flag) return null;
  const styles = fileFlagStyles[flag];
  return (
    <Badge
      leftSection={styles.icon}
      color={styles.color}
      variant="filled"
      size="xs"
    >
      {flag}
    </Badge>
  );
};
