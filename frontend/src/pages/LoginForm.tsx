import { useState } from 'react';
import { useMutation } from 'urql';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom } from '../atoms/authAtom';
import { loginMutation } from '../urql/mutations/LoginMutation';
import {
  Button,
  Center,
  Container,
  Image,
  MantineStyleProp,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { ParticleBackground } from '../components/ParticleBackground';

export const LoginForm = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [fail, setFail] = useState(false);
  const [, mutate] = useMutation(loginMutation);
  const set = useSetAtom(authKeyAtom);

  const doLogin = (e) => {
    mutate({ username: user, password: pass }).then((result) => {
      const token = result?.data?.auth ?? '';
      set(token);
      setFail(token === '');
    });
    e.preventDefault();
  };

  return (
    <>
      <ParticleBackground />
      <Center style={{ height: '100vh' }}>
        <Container size="md">
          <Paper radius="md" p="xl" withBorder>
            <PicrLogo style={{ width: 32, float: 'right' }} />
            <Text size="lg" fw={500} pb="lg">
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
      </Center>
    </>
  );
};

export const LogoutButton = () => {
  const set = useSetAtom(authKeyAtom);
  return <Button onClick={() => set('')}>Log out</Button>;
};

export const PicrLogo = ({ style }: { style?: MantineStyleProp }) => {
  return <Image src="/logo192.png" style={style} />;
};
