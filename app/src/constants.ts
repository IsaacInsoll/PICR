import { ColorValue } from 'react-native';
import { StyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';
import { TextStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';
import { StyleProps } from 'react-native-reanimated';

export const picrColors: ColorValue[] = [
  '#4c669f',
  '#3b5998',
  '#192f6a',
] as const;

export const picrManualURL = 'https://isaacinsoll.github.io/PICR/';

export const mainFont = [
  'Signika_300Light',
  'Signika_400Regular',
  'Signika_500Medium',
  'Signika_600SemiBold',
  'Signika_700Bold',
] as const;

export const typographyScale = [36, 30, 24, 20, 16, 14] as const;

export const finePrint: StyleProp<TextStyle> = { opacity: 0.5 } as const;

export const navBarIconProps: StyleProp<TextStyle> = {
  minWidth: 32,
  minHeight: 24,
};
