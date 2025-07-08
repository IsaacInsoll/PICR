import { StyleProp, Text as RNText, TextProps, TextStyle } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';

type TextVariant = 'dimmed' | 'bold' | 'code';
export const PText = ({
  variant,
  style,
  children,
  ...props
}: TextProps & { variant?: TextVariant }) => {
  const theme = useAppTheme();
  const s = [
    { color: theme.textColor },
    variant ? variants[variant] : undefined,
    style,
  ];
  return (
    <RNText style={s} {...props}>
      {children}
    </RNText>
  );
};

const variants: { [k in TextVariant]: StyleProp<TextStyle> } = {
  dimmed: { opacity: 0.5 },
  bold: { fontWeight: 'bold' },
  code: { fontFamily: 'monospace', fontSize: 11, opacity: 0.33 },
};
