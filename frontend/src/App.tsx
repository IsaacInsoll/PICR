import { grommet, Grommet } from 'grommet';
import { client } from './urqlClient';
import { Provider } from 'urql';
import { BrowserRouter } from 'react-router-dom';
import { Router } from './Router';

const App = () => (
  <Provider value={client}>
    <BrowserRouter>
      <Grommet theme={grommet}>
        <Router />
      </Grommet>
    </BrowserRouter>
  </Provider>
);

export default App;
