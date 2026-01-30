import { Text, TextProps, TextStyle } from 'react-native';
import { typographyScale } from '@/src/constants';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAtomValue } from 'jotai';
import { headingFontKeyAtom } from '@/src/atoms/atoms';
import { getHeadingFontFamilyForLevel } from '@/src/helpers/headingFont';

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
  const headingFontKey = useAtomValue(headingFontKeyAtom);
  const fontFamily = getHeadingFontFamilyForLevel(headingFontKey, level);
  return (
    <Text
      style={[
        styles[level],
        { color: theme.textColor, fontFamily },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles: { [k in TitleLevel]: TextStyle } = {
  1: { fontSize: typographyScale[1] },
  2: { fontSize: typographyScale[2] },
  3: { fontSize: typographyScale[3] },
  4: { fontSize: typographyScale[4] },
} as const;
