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
import { HelmetProvider } from 'react-helmet-async';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { UserProvider } from './components/UserProvider';
import { Suspense, useEffect, useRef } from 'react';
import { PicrErrorBoundary } from './components/PicrErrorBoundary';
import { useSetAtom } from 'jotai/index';
import { lightboxRefAtom } from './atoms/lightboxRefAtom';

const App = () => {
  const authKey = useAtomValue(authKeyAtom);
  const sessionKey = useSessionKey();
  const client = createClient(authKey, sessionKey);
  const customTheme = useAtomValue(themeModeAtom);

  //we put a portal at the start, otherwise Mantine Modals will be hidden behind it
  const portal = useRef<HTMLDivElement>(null);
  const setPortal = useSetAtom(lightboxRefAtom);

  useEffect(() => {
    setPortal(portal);
  }, [setPortal, portal]);

  return (
    <HelmetProvider>
      <URQLProvider value={client}>
        <BrowserRouter>
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
          </MantineProvider>
        </BrowserRouter>
      </URQLProvider>
    </HelmetProvider>
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
