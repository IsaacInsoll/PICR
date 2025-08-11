import { Text, TextProps, TextStyle } from 'react-native';
import { mainFont, typographyScale } from '@/src/constants';
import { useAppTheme } from '@/src/hooks/useAppTheme';

type TitleLevel = 1 | 2 | 3 | 4;

export const PTitle = ({
  children,
  level = 1,
  style,
  ...props
}: {
  level?: TitleLevel;
} & TextProps) => {
  const theme = useAppTheme();
  return (
    <Text style={[styles[level], { color: theme.textColor }, style]} {...props}>
      {children}
    </Text>
  );
};

const styles: { [k in TitleLevel]: TextStyle } = {
  1: { fontFamily: mainFont[2], fontSize: typographyScale[1] },
  2: { fontFamily: mainFont[3], fontSize: typographyScale[2] },
  3: { fontFamily: mainFont[4], fontSize: typographyScale[3] },
  4: { fontFamily: mainFont[1], fontSize: typographyScale[4] },
} as const;
