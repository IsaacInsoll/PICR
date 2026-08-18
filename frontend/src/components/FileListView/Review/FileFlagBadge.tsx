import { FileFlag } from '@shared/gql/graphql';
import { Badge } from '@mantine/core';
import { fileFlagStyles } from './fileFlagStyles';
import { useTranslation } from 'react-i18next';

interface FileFlagBadgeProps {
  flag?: FileFlag | null;
  hideIfNone?: boolean;
}

// A read-only representation of the current badge
export const FileFlagBadge = ({ flag, hideIfNone }: FileFlagBadgeProps) => {
  const { t } = useTranslation('gallery');
  if (hideIfNone && (!flag || flag === FileFlag.None)) return null;
  if (!flag) return null;
  const styles = fileFlagStyles[flag];
  return (
    <Badge
      leftSection={styles.icon}
      color={styles.color}
      variant="filled"
      size="xs"
    >
      {t(styles.labelKey)}
    </Badge>
  );
};
