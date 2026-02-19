import { PropsWithChildren } from 'react';
import { Padding, PaddingSize } from '../constants';
import { View, ViewStyle } from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
export const PView = ({
  gap,
  children,
  style,
  onWidthChange,
  row,
}: PropsWithChildren<{
  gap?: Padding;
  style?: StyleProp<ViewStyle>;
  row?: boolean;
  onWidthChange?: (width: number) => void;
}>) => {
  const s: StyleProp<ViewStyle> = {
    gap: gap ? PaddingSize[gap] : undefined,
    flexDirection: row ? 'row' : 'column',
  };
  return (
    <View
      style={[style, s]}
      onLayout={(e) => {
        if (onWidthChange) onWidthChange(e.nativeEvent.layout.width);
      }}
    >
      {children}
    </View>
  );
};
