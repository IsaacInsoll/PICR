import { useState } from 'react';
import { useMutation } from 'urql';
import { useNavigate } from 'react-router-dom';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom, useIsLoggedIn } from '../atoms/authAtom';
import { loginMutation } from '../urql/mutations/LoginMutation';
import { Button, Container, TextInput, Title } from '@mantine/core';

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
    <Container fluid style={{ align: 'center' }}>
      <Container size="xs">
        <Title>PICR Login</Title>
        <TextInput
          label="Username"
          name="username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />

        <TextInput
          label="Password"
          name="password"
          type="password"
          error={
            fail
              ? 'Login Failed. Please check your username and password'
              : undefined
          }
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <Button onClick={doLogin}>Login</Button>
      </Container>
    </Container>
  );
};

export const LogoutButton = () => {
  const set = useSetAtom(authKeyAtom);
  return <Button onClick={() => set('')}>Log out</Button>;
};
