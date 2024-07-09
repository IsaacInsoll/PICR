import { Box, Button, FormField, Heading, Keyboard, TextInput } from 'grommet';
import { useState } from 'react';
import { useMutation } from 'urql';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom, useIsLoggedIn } from '../atoms/authAtom';
import { loginMutation } from '../urql/mutations/LoginMutation';

export const LoginForm = () => {
  const loggedIn = useIsLoggedIn();
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [fail, setFail] = useState(false);
  const [, mutate] = useMutation(loginMutation);
  const set = useSetAtom(authKeyAtom);

  if (loggedIn) {
    navigate('/admin/f/1');
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

export const LogoutButton = () => {
  const set = useSetAtom(authKeyAtom);
  return <Button onClick={() => set('')}>Log out</Button>;
};
