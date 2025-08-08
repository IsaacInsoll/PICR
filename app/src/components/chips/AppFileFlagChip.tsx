import { FileFlag } from '@shared/gql/graphql';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { ApprovedIcon, RejectedIcon } from '@/src/components/AppIcons';

export const AppFileFlagChip = ({
  flag,
  hideIfNone,
}: {
  flag?: FileFlag;
  hideIfNone?: boolean;
}) => {
  const theme = useAppTheme();
  if (hideIfNone && (!flag || flag == FileFlag.None)) return null;
  if (!flag) return null;
  if (flag == 'approved') {
    return <ApprovedIcon color={theme.green} />;
  }
  if (flag == 'rejected') {
    return <RejectedIcon color={theme.green} />;
  }

  return;
};
