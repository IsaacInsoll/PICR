import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import type { FontKey } from '@shared/branding/fontRegistry';
import {
  isHeadingFontLoaded,
  loadHeadingFont,
} from '@/src/helpers/headingFont';

const FolderBrandingContext = createContext<FontKey>('default');

export const useFolderHeadingFont = () => useContext(FolderBrandingContext);

export const FolderBrandingProvider = ({
  fontKey,
  children,
}: {
  fontKey: FontKey;
  children: ReactNode;
}) => {
  const [fontLoad, setFontLoad] = useState<{
    fontKey: FontKey;
    successful: boolean;
  } | null>(null);
  const activeFontKey =
    fontKey === 'default' ||
    isHeadingFontLoaded(fontKey) ||
    (fontLoad?.fontKey === fontKey && fontLoad.successful)
      ? fontKey
      : 'default';

  useEffect(() => {
    if (fontKey === 'default' || isHeadingFontLoaded(fontKey)) {
      return;
    }

    let cancelled = false;
    loadHeadingFont(fontKey)
      .then(() => {
        if (!cancelled) setFontLoad({ fontKey, successful: true });
      })
      .catch(() => {
        if (!cancelled) setFontLoad({ fontKey, successful: false });
      });

    return () => {
      cancelled = true;
    };
  }, [fontKey]);

  return (
    <FolderBrandingContext.Provider value={activeFontKey}>
      {children}
    </FolderBrandingContext.Provider>
  );
};
