import { grommet, Grommet, ThemeType } from 'grommet';
import { createClient } from './urqlClient';
import { Provider } from 'urql';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { authKeyAtom, useIsLoggedIn } from './atoms/authAtom';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from './atoms/themeModeAtom';

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
        <Grommet full theme={theme} themeMode={themeMode}>
          <Router loggedIn={loggedIn} />
        </Grommet>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

export const theme: ThemeType = {
  ...grommet,
  pageHeader: { pad: { top: 'small' } },
};
