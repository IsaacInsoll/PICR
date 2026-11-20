import { useState } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import type { MantineStyleProp } from '@mantine/core';
import {
  Alert,
  Anchor,
  Button,
  Image,
  Paper,
  PasswordInput,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { acceptAdminSession, authRequest } from '../helpers/adminSession';
import type { AdminAuthResult } from '@shared/auth/adminAuth';
import { AuthenticatorEnrollment } from './management/AuthenticatorEnrollment';
import { authErrorKey } from '../helpers/authErrorKey';
import classes from './LoginForm.module.css';

export const LoginForm = ({
  initialUsername = '',
  description,
  onAuthenticated,
}: {
  initialUsername?: string;
  description?: string;
  onAuthenticated?: () => void;
}) => {
  const { t } = useTranslation('admin');
  const compact = useMediaQuery('(max-width: 360px)');
  const [user, setUser] = useState(initialUsername);
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
      if (result.status === 'authenticated') {
        acceptAdminSession(result);
        onAuthenticated?.();
      } else setChallenge(result);
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
          <Stack gap="lg">
            <PicrLogo style={{ width: 64, alignSelf: 'center' }} />
            <AuthenticatorEnrollment
              challenge={challenge.challenge}
              onCancel={() => setChallenge(null)}
              onComplete={onAuthenticated}
            />
          </Stack>
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
          <Stack gap="xs" align="center">
            <PicrLogo style={{ width: 64 }} />
            <Title order={2}>
              {challenge ? t('security.verifyTitle') : t('login.title')}
            </Title>
            {!challenge && description ? (
              <Text c="dimmed" size="sm" ta="center">
                {description}
              </Text>
            ) : null}
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
                    name="recoveryCode"
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
                    name="username"
                    label={t('login.username')}
                    value={user}
                    autoComplete="username"
                    onChange={(event) => setUser(event.currentTarget.value)}
                  />
                  <PasswordInput
                    name="password"
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
