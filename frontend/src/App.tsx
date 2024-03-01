import { grommet, Grommet, ThemeType } from 'grommet';
import { createClient } from './urqlClient';
import { Provider } from 'urql';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';
import { authKeyAtom, useIsLoggedIn } from './atoms/authAtom';
import { useAtomValue } from 'jotai';

const App = () => {
  const loggedIn = useIsLoggedIn();
  const authKey = useAtomValue(authKeyAtom);
  const client = createClient(authKey);
  console.log('LoggedIn: ' + (loggedIn ? 'yes' : 'no'));

  return (
    <Provider value={client}>
      <BrowserRouter>
        <Grommet theme={theme}>
          <Router loggedIn={loggedIn} />
        </Grommet>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

const theme: ThemeType = {
  ...grommet,
  pageHeader: { pad: { top: 'small' } },
};
