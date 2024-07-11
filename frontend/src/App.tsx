import { createClient } from './urqlClient';
import { Provider } from 'urql';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { authKeyAtom, useIsLoggedIn } from './atoms/authAtom';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from './atoms/themeModeAtom';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import 'mantine-react-table/styles.css';

import { createTheme, MantineProvider } from '@mantine/core';
import { HelmetProvider } from 'react-helmet-async';
import { Notifications } from '@mantine/notifications';

const App = () => {
  const loggedIn = useIsLoggedIn();
  const authKey = useAtomValue(authKeyAtom);
  const client = createClient(authKey);
  const themeMode = useAtomValue(themeModeAtom);
  console.log('themeMode', themeMode);
  console.log('LoggedIn: ' + (loggedIn ? 'yes' : 'no'));

  return (
    <HelmetProvider>
      <Provider value={client}>
        <BrowserRouter>
          <MantineProvider theme={theme} defaultColorScheme={themeMode}>
            <Router loggedIn={loggedIn} />
            <Notifications />
          </MantineProvider>
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  );
};

export const theme = createTheme({
  /** Your theme override here */
});
export default App;
