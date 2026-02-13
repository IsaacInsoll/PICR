import { PText } from '@/src/components/PText';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { View } from 'react-native';
import { CommentIcon } from '@/src/components/AppIcons';

export const AppCommentsChip = ({
  totalComments,
  hideIfNone,
}: {
  totalComments?: number | null;
  hideIfNone?: boolean;
}) => {
  const theme = useAppTheme();
  if (hideIfNone && (!totalComments || totalComments === 0)) return null;
  if (!totalComments) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <PText style={{ color: theme.blue }}>{totalComments}</PText>
      <CommentIcon
        style={{ color: theme.blue }}
        size={12}
        totalComments={totalComments}
      />
    </View>
  );
};
