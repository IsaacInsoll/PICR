import { Text, TextStyle } from 'react-native';
import { ReactNode } from 'react';
import { mainFont } from '@/src/constants';

type TitleLevel = 1 | 2 | 3;

export const Title = ({
  children,
  level = 1,
  style = {},
}: {
  children: ReactNode;
  level?: TitleLevel;
  style: TextStyle;
}) => {
  return <Text style={{ ...styles[level], ...style }}>{children}</Text>;
};

const styles: { [k in TitleLevel]: TextStyle } = {
  1: { fontFamily: mainFont[2], fontSize: 30 },
  2: { fontFamily: mainFont[3], fontSize: 24 },
  3: { fontFamily: mainFont[4], fontSize: 18 },
} as const;
