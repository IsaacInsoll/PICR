import { createClient } from './urqlClient';
import { Provider } from 'urql';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { authKeyAtom, useIsLoggedIn } from './atoms/authAtom';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from './atoms/themeModeAtom';

import '@mantine/core/styles.css';
import { createTheme, MantineProvider } from '@mantine/core';

const App = () => {
  const loggedIn = useIsLoggedIn();
  const authKey = useAtomValue(authKeyAtom);
  const client = createClient(authKey);
  const themeMode = useAtomValue(themeModeAtom);
  console.log('themeMode', themeMode);
  console.log('LoggedIn: ' + (loggedIn ? 'yes' : 'no'));

  return (
    <Provider value={client}>
      <BrowserRouter>
        <MantineProvider theme={theme}>
          <Router loggedIn={loggedIn} />
        </MantineProvider>
      </BrowserRouter>
    </Provider>
  );
};

export const theme = createTheme({
  /** Your theme override here */
});
export default App;
