import { ColorValue } from 'react-native';
import { Signika_300Light } from '@expo-google-fonts/signika/300Light';
import { Signika_400Regular } from '@expo-google-fonts/signika/400Regular';
import { Signika_500Medium } from '@expo-google-fonts/signika/500Medium';
import { Signika_600SemiBold } from '@expo-google-fonts/signika/600SemiBold';
import { Signika_700Bold } from '@expo-google-fonts/signika/700Bold';

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
