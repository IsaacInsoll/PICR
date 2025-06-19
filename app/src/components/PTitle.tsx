import { Text, TextStyle } from 'react-native';
import { ReactNode } from 'react';
import { mainFont, typographyScale } from '@/src/constants';
import { useAppTheme } from '@/src/hooks/useAppTheme';

type TitleLevel = 1 | 2 | 3;

export const PTitle = ({
  children,
  level = 1,
  style = {},
}: {
  children: ReactNode;
  level?: TitleLevel;
  style?: TextStyle;
}) => {
  const theme = useAppTheme();
  return (
    <Text style={{ ...styles[level], color: theme.textColor, ...style }}>
      {children}
    </Text>
  );
};

const styles: { [k in TitleLevel]: TextStyle } = {
  1: { fontFamily: mainFont[2], fontSize: typographyScale[1] },
  2: { fontFamily: mainFont[3], fontSize: typographyScale[2] },
  3: { fontFamily: mainFont[4], fontSize: typographyScale[3] },
} as const;
