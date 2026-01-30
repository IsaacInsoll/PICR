import { ReactNode, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { PText } from '@/src/components/PText';
import { getBaseFontFiles, loadHeadingFont } from '@/src/helpers/headingFont';
import { useAtomValue } from 'jotai';
import { headingFontKeyAtom } from '@/src/atoms/atoms';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const headingFontKey = useAtomValue(headingFontKeyAtom);
  const [fontsLoaded] = useFonts(getBaseFontFiles());

  useEffect(() => {
    loadHeadingFont(headingFontKey);
  }, [headingFontKey]);

  if (!fontsLoaded) return <PText>Loading Fonts...</PText>;
  return children;
};
