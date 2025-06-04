import { StyleProp, Text as RNText, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type TextVariant = 'dimmed' | 'bold';
export const PText = ({
  variant,
  style,
  children,
  ...props
}: TextProps & { variant?: TextVariant }) => {
  const theme = useTheme();
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
};
