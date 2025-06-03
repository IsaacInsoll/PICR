import { ReactNode } from 'react';
import { useFonts } from '@expo-google-fonts/signika/useFonts';
import { Signika_300Light } from '@expo-google-fonts/signika/300Light';
import { Signika_400Regular } from '@expo-google-fonts/signika/400Regular';
import { Signika_500Medium } from '@expo-google-fonts/signika/500Medium';
import { Signika_600SemiBold } from '@expo-google-fonts/signika/600SemiBold';
import { Signika_700Bold } from '@expo-google-fonts/signika/700Bold';
import { Text } from 'react-native';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  let [fontsLoaded] = useFonts({
    Signika_300Light,
    Signika_400Regular,
    Signika_500Medium,
    Signika_600SemiBold,
    Signika_700Bold,
  });
  if (!fontsLoaded) return <Text>Loading Fonts...</Text>;
  return children;
};
