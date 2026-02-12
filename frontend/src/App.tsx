import { createClient } from './urqlClient';
import { Provider as URQLProvider } from 'urql';
import { BrowserRouter } from 'react-router';
import { authKeyAtom, sessionKeyAtom, useSessionKey } from './atoms/authAtom';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from './atoms/themeModeAtom';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-react-table/styles.css';

import { LoadingOverlay, MantineProvider, Portal } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { UserProvider } from './components/UserProvider';
import { Suspense, useEffect, useRef } from 'react';
import { PicrErrorBoundary } from './components/PicrErrorBoundary';
import { useSetAtom } from 'jotai';
import { lightboxRefAtom } from './atoms/lightboxRefAtom';
import { getBaseHrefPathname } from './helpers/baseHref';
import { fontFamilies } from './fonts.generated';
import { GlobalErrorOverlay } from './components/GlobalErrorOverlay';

const App = () => {
  const authKey = useAtomValue(authKeyAtom);
  const sessionKey = useSessionKey();
  const client = createClient(authKey, sessionKey);
  const customTheme = useAtomValue(themeModeAtom);
  const basePathname = getBaseHrefPathname();

  //we put a portal at the start, otherwise Mantine Modals will be hidden behind it
  const portal = useRef<HTMLDivElement>(null);
  const setPortal = useSetAtom(lightboxRefAtom);

  useEffect(() => {
    setPortal(portal);
  }, [setPortal, portal]);

  useEffect(() => {
    console.log('setting default font: ', customTheme.headingFontKey);
    const key = customTheme.headingFontKey ?? 'default';
    const family =
      key in fontFamilies
        ? fontFamilies[key as keyof typeof fontFamilies]
        : fontFamilies.default;
    const cssFamily = family.includes(' ') ? `"${family}"` : family;
    document.documentElement.style.setProperty(
      '--picr-heading-font',
      cssFamily,
    );
  }, [customTheme.headingFontKey]);

  return (
    <URQLProvider value={client}>
      <BrowserRouter basename={basePathname || undefined}>
        <MantineProvider
          theme={{ ...theme, primaryColor: customTheme.primaryColor }}
          forceColorScheme={
            customTheme.mode == 'auto' ? undefined : customTheme.mode
          }
          defaultColorScheme={'auto'}
        >
          <Portal className="lightbox-portal">
            <div ref={portal} />
          </Portal>
          <PicrErrorBoundary>
            <Suspense fallback={<PicrLoadingOverlay />}>
              <UserProvider />
              <Notifications />
            </Suspense>
          </PicrErrorBoundary>
          <GlobalErrorOverlay />
        </MantineProvider>
      </BrowserRouter>
    </URQLProvider>
  );
};

export default App;

const PicrLoadingOverlay = () => {
  return (
    <LoadingOverlay
      visible={true}
      zIndex={1000}
      overlayProps={{ radius: 'sm', blur: 2 }}
      loaderProps={{ size: 'xl' }}
    />
  );
};
