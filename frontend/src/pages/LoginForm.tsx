import { Box, FormField, Heading, TextInput, Button, Keyboard } from 'grommet';
import { useState } from 'react';
import { gql } from '../helpers/gql';
import { useMutation } from 'urql';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom, useIsLoggedIn } from '../atoms/authAtom';

export const LoginForm = () => {
  const loggedIn = useIsLoggedIn();
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [fail, setFail] = useState(false);
  const [, mutate] = useMutation(loginMutation);
  const set = useSetAtom(authKeyAtom);

  if (loggedIn) {
    navigate('/admin');
  }

  const doLogin = () => {
    mutate({ username: user, password: pass }).then((result) => {
      const token = result?.data?.auth ?? '';
      set(token);
      setFail(token === '');
    });
  };
  return (
    <Box align="center">
      <Box width="medium" margin="large">
        <Heading>PICR Login</Heading>
        <FormField label="Username">
          <Keyboard onEnter={doLogin}>
            <TextInput
              name="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            />
          </Keyboard>
        </FormField>
        <FormField
          label="Password"
          error={
            fail
              ? 'Login Failed. Please check your username and password'
              : undefined
          }
        >
          <Keyboard onEnter={doLogin}>
            <TextInput
              name="password"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </Keyboard>
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
