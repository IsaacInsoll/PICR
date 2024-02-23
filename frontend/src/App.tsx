import './App.css';
import { LoginForm } from './LoginForm';

import { grommet, Box, Heading, Grommet, Paragraph } from 'grommet';

const App = () => (
  <Grommet theme={grommet}>
    <Box pad="small">
      <Heading>Hello World</Heading>
      <Paragraph>Hello from a Grommet page!</Paragraph>
    </Box>
    <LoginForm />
  </Grommet>
);

export default App;
