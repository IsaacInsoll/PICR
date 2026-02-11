import { ReactNode } from 'react';
import { useFonts } from 'expo-font';
import { PText } from '@/src/components/PText';
import { getBaseFontFiles } from '@/src/helpers/headingFont';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [fontsLoaded] = useFonts(getBaseFontFiles());
  if (!fontsLoaded) return <PText>Loading Fonts...</PText>;
  return children;
};
