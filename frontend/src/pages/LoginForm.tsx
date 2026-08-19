import { useState } from 'react';
import { useMutation } from 'urql';
import { useSetAtom } from 'jotai';
import { authKeyAtom } from '../atoms/authAtom';
import { loginMutation } from '@shared/urql/mutations/loginMutation';
import type { MantineStyleProp } from '@mantine/core';
import {
  Button,
  Center,
  Container,
  Group,
  Image,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
// Language switcher soft-disabled (#84) — restore alongside the JSX below.
// import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

export const LoginForm = () => {
  const { t } = useTranslation('admin');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [fail, setFail] = useState(false);
  const [, mutate] = useMutation(loginMutation);
  const set = useSetAtom(authKeyAtom);

  const doLogin = (e: React.FormEvent) => {
    void mutate({ username: user, password: pass }).then((result) => {
      const token = result.data?.auth ?? '';
      set(token);
      setFail(token === '');
    });
    e.preventDefault();
  };

  return (
    <>
      <Center style={{ height: '100vh' }}>
        <Container size="md">
          <Paper radius="md" p="xl" withBorder>
            <Group justify="space-between" align="flex-start" mb="lg">
              <Text size="lg" fw={500}>
                {t('login.title')}
              </Text>
              <Stack align="flex-end" gap="xs">
                <PicrLogo style={{ width: 32 }} />
                {/* Language switcher soft-disabled (#84) — it cluttered the login screen. */}
                {/* <LanguageSwitcher /> */}
              </Stack>
            </Group>
            <form onSubmit={doLogin}>
              <Stack>
                <TextInput
                  required
                  label={t('login.username')}
                  value={user}
                  onChange={(event) => setUser(event.currentTarget.value)}
                  radius="md"
                />

                <PasswordInput
                  required
                  label={t('login.password')}
                  placeholder={t('login.passwordPlaceholder')}
                  value={pass}
                  onChange={(event) => {
                    if (fail) setFail(false);
                    setPass(event.currentTarget.value);
                  }}
                  error={fail ? t('login.failed') : undefined}
                  radius="md"
                />
                <Button type="submit">{t('login.submit')}</Button>
              </Stack>
            </form>
          </Paper>
        </Container>
      </Center>
    </>
  );
};

export const PicrLogo = ({ style }: { style?: MantineStyleProp }) => {
  return <Image src="logo192.png" alt="PICR" style={style} />;
};
