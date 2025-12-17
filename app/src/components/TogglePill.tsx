import { useAppTheme } from '@/src/hooks/useAppTheme';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { PText } from '@/src/components/PText';

export const TogglePill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => {
  const theme = useAppTheme();
  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={[
          styles.pill,
          {
            borderColor: active ? theme.brandColor : theme.dimmedColor,
            backgroundColor: active
              ? theme.brandColor + '22'
              : theme.mode === 'dark'
                ? '#ffffff0f'
                : '#00000006',
          },
        ]}
      >
        <PText style={{ color: active ? theme.brandColor : theme.textColor }}>
          {label}
        </PText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
});
