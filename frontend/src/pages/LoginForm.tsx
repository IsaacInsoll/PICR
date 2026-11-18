import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import type { MantineStyleProp } from '@mantine/core';
import {
  Alert,
  Anchor,
  Button,
  Group,
  Image,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { MdLockOutline, MdVerifiedUser } from 'react-icons/md';
import { acceptAdminSession, authRequest } from '../helpers/adminSession';
import type { AdminAuthResult } from '@shared/auth/adminAuth';
import { AuthenticatorEnrollment } from './management/AuthenticatorEnrollment';
import { authErrorKey } from '../helpers/authErrorKey';
import classes from './LoginForm.module.css';

export const LoginForm = () => {
  const { t } = useTranslation('admin');
  const compact = useMediaQuery('(max-width: 360px)');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [challenge, setChallenge] = useState<Extract<
    AdminAuthResult,
    { challenge: string }
  > | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = challenge
        ? await authRequest<AdminAuthResult>('verify', {
            challenge: challenge.challenge,
            code,
          })
        : await authRequest<AdminAuthResult>('login', {
            username: user,
            password,
          });
      setPassword('');
      if (result.status === 'authenticated') acceptAdminSession(result);
      else setChallenge(result);
    } catch (error) {
      setError(t(authErrorKey(error)));
      setCode('');
    } finally {
      setBusy(false);
    }
  };
  if (challenge?.status === 'enrollment_required')
    return (
      <div className={classes.screen}>
        <Paper
          p={{ base: 'lg', sm: 'xl' }}
          radius="lg"
          withBorder
          className={classes.card}
        >
          <AuthenticatorEnrollment
            challenge={challenge.challenge}
            onCancel={() => setChallenge(null)}
          />
        </Paper>
      </div>
    );
  return (
    <div className={classes.screen}>
      <Paper
        p={{ base: 'lg', sm: 'xl' }}
        radius="lg"
        withBorder
        className={classes.card}
      >
        <Stack gap="lg">
          <Group justify="space-between">
            <PicrLogo style={{ width: 36 }} />
            <Text size="sm" c="dimmed">
              {t('security.photographerAccess')}
            </Text>
          </Group>
          <Stack gap="xs" align="center">
            <ThemeIcon size={56} radius="xl" variant="light">
              {challenge ? (
                <MdVerifiedUser size={28} />
              ) : (
                <MdLockOutline size={28} />
              )}
            </ThemeIcon>
            <Title order={2}>
              {challenge ? t('security.verifyTitle') : t('login.title')}
            </Title>
            {challenge ? (
              <Text c="dimmed" size="sm" ta="center">
                {recovery
                  ? t('security.recoveryDescription')
                  : t('security.verifyDescription')}
              </Text>
            ) : null}
          </Stack>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <Stack
              gap="lg"
              key={challenge ? String(recovery) : 'password'}
              className={classes.step}
            >
              {challenge ? (
                recovery ? (
                  <TextInput
                    autoFocus
                    label={t('security.recoveryCode')}
                    value={code}
                    onChange={(event) => setCode(event.currentTarget.value)}
                    autoComplete="off"
                  />
                ) : (
                  <Stack align="center" gap="xs">
                    <Text size="sm" fw={500}>
                      {t('security.authenticatorCode')}
                    </Text>
                    <PinInput
                      length={6}
                      type="number"
                      oneTimeCode
                      autoFocus
                      value={code}
                      onChange={setCode}
                      aria-label={t('security.authenticatorCode')}
                      size={compact ? 'sm' : 'md'}
                      gap={compact ? 4 : 8}
                    />
                  </Stack>
                )
              ) : (
                <>
                  <TextInput
                    required
                    label={t('login.username')}
                    value={user}
                    autoComplete="username"
                    onChange={(event) => setUser(event.currentTarget.value)}
                  />
                  <PasswordInput
                    required
                    label={t('login.password')}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                  />
                </>
              )}
              {error ? (
                <Alert color="red" role="alert">
                  {error}
                </Alert>
              ) : null}
              <Button
                type="submit"
                size="md"
                radius="md"
                loading={busy}
                disabled={
                  !!challenge && (recovery ? !code.trim() : code.length !== 6)
                }
              >
                {challenge ? t('security.verify') : t('login.submit')}
              </Button>
              {challenge ? (
                <>
                  <Anchor
                    component="button"
                    type="button"
                    size="sm"
                    onClick={() => {
                      setRecovery(!recovery);
                      setCode('');
                      setError('');
                    }}
                  >
                    {recovery
                      ? t('security.useAuthenticator')
                      : t('security.useRecovery')}
                  </Anchor>
                  <Button
                    variant="subtle"
                    color="gray"
                    onClick={() => {
                      setChallenge(null);
                      setCode('');
                      setError('');
                    }}
                  >
                    {t('security.backToLogin')}
                  </Button>
                </>
              ) : null}
            </Stack>
          </form>
        </Stack>
      </Paper>
    </div>
  );
};
export const PicrLogo = ({ style }: { style?: MantineStyleProp }) => (
  <Image src="logo192.png" alt="PICR" style={style} />
);
