import { PText } from '@/src/components/PText';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { StarIcon } from '@/src/components/AppIcons';
import { View } from 'react-native';

export const AppFileRatingChip = ({
  rating,
  hideIfNone,
}: {
  rating?: number;
  hideIfNone?: boolean;
}) => {
  const theme = useAppTheme();
  if (hideIfNone && (!rating || rating == 0)) return null;
  if (!rating) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <PText style={{ color: theme.gold }}>{rating}</PText>
      <StarIcon style={{ color: theme.gold }} size={12} />
    </View>
  );
};
