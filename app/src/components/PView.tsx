import type { PropsWithChildren } from 'react';
import type { Padding } from '../constants';
import { PaddingSize } from '../constants';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

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
