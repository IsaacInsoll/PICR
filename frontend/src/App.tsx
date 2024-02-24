import './App.css';
import { LoginForm } from './LoginForm';

import { grommet, Grommet } from 'grommet';
import { client } from './urqlClient';
import { Provider } from 'urql';

const App = () => (
  <Provider value={client}>
    <Grommet theme={grommet}>
      <LoginForm />
    </Grommet>
  </Provider>
);

export default App;
