import { PropsWithChildren } from 'react';
import { Padding, PaddingSize } from '../constants';
import { View } from 'react-native';
export const PView = ({
  gap,
  children,
  style,
  row,
}: PropsWithChildren<{ gap: Padding; style?: any; row?: boolean }>) => {
  const s = { gap: PaddingSize[gap], flexDirection: row ? 'row' : 'column' };
  return <View style={s}>{children}</View>;
};
