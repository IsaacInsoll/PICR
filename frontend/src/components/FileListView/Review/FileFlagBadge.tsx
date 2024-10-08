import { FileFlag } from '../../../../../graphql-types';
import { Badge } from '@mantine/core';
import { ReactNode } from 'react';
import { TbThumbDown, TbThumbUp } from 'react-icons/tb';
import { MdOutlineThumbsUpDown } from 'react-icons/md';

interface FileFlagBadgeProps {
  flag: FileFlag;
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

export const fileFlagStyles: { [key in FileFlag]: FlagStyles } = {
  [FileFlag.Approved]: { color: 'green', icon: <TbThumbUp /> },
  [FileFlag.Rejected]: { color: 'red', icon: <TbThumbDown /> },
  [FileFlag.None]: { color: 'gray', icon: <MdOutlineThumbsUpDown /> },
};

interface FlagStyles {
  color: string;
  icon: ReactNode;
}
