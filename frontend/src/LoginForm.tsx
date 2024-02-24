import { Box, FormField, Heading, TextInput, Button } from 'grommet';
import { useState } from 'react';
import { gql } from './gql';
import { useMutation } from 'urql';

export const LoginForm = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [, mutate] = useMutation(loginMutation);

  const doLogin = () => {
    mutate({ username: user, password: pass }).then((x) => console.log);
  };

  return (
    <Box align="center">
      <Box width="medium" margin="large">
        <Heading>PICR Login</Heading>
        <FormField label="Username">
          <TextInput
            name="username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </FormField>
        <FormField label="Password">
          <TextInput
            name="password"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </FormField>
        <Button label="Login" onClick={doLogin} />
      </Box>
    </Box>
  );
};

const loginMutation = gql(/* GraphQL */ `
  mutation login($username: String!, $password: String!) {
    auth(user: $username, password: $password)
  }
`);
