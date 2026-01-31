import { ReactNode, useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { PText } from '@/src/components/PText';
import { getBaseFontFiles, loadHeadingFont } from '@/src/helpers/headingFont';
import { useAtomValue } from 'jotai';
import { headingFontKeyAtom } from '@/src/atoms/atoms';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const headingFontKey = useAtomValue(headingFontKeyAtom);
  const [fontsLoaded] = useFonts(getBaseFontFiles());
  const [headingFontLoaded, setHeadingFontLoaded] = useState(
    headingFontKey === 'default',
  );

  useEffect(() => {
    if (headingFontKey === 'default') {
      setHeadingFontLoaded(true);
      return;
    }
    setHeadingFontLoaded(false);
    loadHeadingFont(headingFontKey)
      .then(() => setHeadingFontLoaded(true))
      .catch(() => {
        // Fall back to default font if custom font fails to load
        setHeadingFontLoaded(true);
      });
  }, [headingFontKey]);

  if (!fontsLoaded || !headingFontLoaded) return <PText>Loading Fonts...</PText>;
  return children;
};
