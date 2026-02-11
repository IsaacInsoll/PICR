import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { FontKey } from '@shared/branding/fontRegistry';
import { isHeadingFontLoaded, loadHeadingFont } from '@/src/helpers/headingFont';

const FolderBrandingContext = createContext<FontKey>('default');

export const useFolderHeadingFont = () => useContext(FolderBrandingContext);

export const FolderBrandingProvider = ({
  fontKey,
  children,
}: {
  fontKey: FontKey;
  children: ReactNode;
}) => {
  // If the font was loaded in a previous visit, use it immediately to avoid flash
  const [activeFontKey, setActiveFontKey] = useState<FontKey>(
    isHeadingFontLoaded(fontKey) ? fontKey : 'default',
  );

  useEffect(() => {
    if (fontKey === 'default' || isHeadingFontLoaded(fontKey)) {
      setActiveFontKey(fontKey);
      return;
    }
    loadHeadingFont(fontKey)
      .then(() => setActiveFontKey(fontKey))
      .catch(() => setActiveFontKey('default'));
  }, [fontKey]);

  return (
    <FolderBrandingContext.Provider value={activeFontKey}>
      {children}
    </FolderBrandingContext.Provider>
  );
};
