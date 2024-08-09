import { createClient } from './urqlClient';
import { Provider as URQLProvider } from 'urql';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { authKeyAtom, useIsLoggedIn } from './atoms/authAtom';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from './atoms/themeModeAtom';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-react-table/styles.css';

import { MantineProvider } from '@mantine/core';
import { HelmetProvider } from 'react-helmet-async';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { UserProvider } from './components/UserProvider';
import { Suspense } from 'react';

const App = () => {
  const authKey = useAtomValue(authKeyAtom);
  const client = createClient(authKey);
  const themeMode = useAtomValue(themeModeAtom);

  return (
    <HelmetProvider>
      <URQLProvider value={client}>
        <BrowserRouter>
          <MantineProvider theme={theme} defaultColorScheme={themeMode}>
            <Suspense fallback={''}>
              <UserProvider />
              <Notifications />
            </Suspense>
          </MantineProvider>
        </BrowserRouter>
      </URQLProvider>
    </HelmetProvider>
  );
};

export default App;
