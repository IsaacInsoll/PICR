import { PropsWithChildren } from 'react';
import { Padding, PaddingSize } from '../constants';
import { View, ViewStyle } from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { StyleProps } from 'react-native-reanimated';
export const PView = ({
  gap,
  children,
  style,
  onWidthChange,
  row,
}: PropsWithChildren<{
  gap?: Padding;
  style?: StyleProps | undefined;
  row?: boolean;
  onWidthChange?: (width: number) => void;
}>) => {
  const s: StyleProp<ViewStyle> = {
    gap: PaddingSize[gap],
    flexDirection: row ? 'row' : 'column',
  };
  return (
    <View
      style={!!style ? { ...style, ...s } : s}
      onLayout={(e) => {
        if (onWidthChange) onWidthChange(e.nativeEvent.layout.width);
      }}
    >
      {children}
    </View>
  );
};
