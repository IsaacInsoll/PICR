import { useState } from 'react';
import { useMutation } from 'urql';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom, useIsLoggedIn } from '../atoms/authAtom';
import { loginMutation } from '../urql/mutations/LoginMutation';
import {
  Button,
  Container,
  Paper,
  PasswordInput,
  Stack,
  TextInput,
  Title,
  Text,
} from '@mantine/core';

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

  const doLogin = (e) => {
    mutate({ username: user, password: pass }).then((result) => {
      const token = result?.data?.auth ?? '';
      set(token);
      setFail(token === '');
    });
    e.preventDefault();
  };

  return (
    <Container size="xs" pt="xl">
      <Paper radius="md" p="xl" withBorder>
        <Text size="lg" fw={500}>
          Login to PICR
        </Text>
        <form onSubmit={doLogin}>
          <Stack>
            <TextInput
              required
              label="Username"
              value={user}
              onChange={(event) => setUser(event.currentTarget.value)}
              radius="md"
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              value={pass}
              onChange={(event) => {
                if (fail) setFail(false);
                setPass(event.currentTarget.value);
              }}
              error={
                fail
                  ? 'Login Failed. Please check your username and password'
                  : undefined
              }
              radius="md"
            />
            <Button type="submit">Login</Button>
          </Stack>
        </form>
      </Paper>
    </Container>

    // <TextInput
    //   label="Username"
    //   name="username"
    //   value={user}
    //   onChange={(e) => setUser(e.target.value)}
    // />
    //
    // <TextInput
    //   label="Password"
    //   name="password"
    //   type="password"
    //   error={
    //     fail
    //       ? 'Login Failed. Please check your username and password'
    //       : undefined
    //   }
    //   value={pass}
    //   onChange={(e) => setPass(e.target.value)}
    // />
    // <Button onClick={doLogin}>Login</Button>
  );
};

export const LogoutButton = () => {
  const set = useSetAtom(authKeyAtom);
  return <Button onClick={() => set('')}>Log out</Button>;
};
