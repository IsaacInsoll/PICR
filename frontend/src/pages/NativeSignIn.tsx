import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import {
  Alert,
  Box,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import {
  parseNativeAuthorization,
  type NativeAccount,
} from '@shared/auth/nativeAuth';
import { authKeyAtom } from '../atoms/authAtom';
import { authenticatedRequest, logoutAdmin } from '../helpers/adminSession';
import { authErrorKey } from '../helpers/authErrorKey';
import { withBasePath } from '../helpers/baseHref';
import { PicrAvatar } from '../components/PicrAvatar';
import { LoginForm, PicrLogo } from './LoginForm';
import classes from './LoginForm.module.css';

export function NativeSignIn() {
  const { t } = useTranslation('admin');
  const [params] = useSearchParams();
  const request = parseNativeAuthorization(params);
  const token = useAtomValue(authKeyAtom);
  const [account, setAccount] = useState<
    (NativeAccount & { token: string }) | null
  >(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [freshSignIn, setFreshSignIn] = useState(false);
  const [callback, setCallback] = useState('');
  const [attempt, setAttempt] = useState(0);
  const connecting = useRef(false);
  const validRequest = !!request;
  useEffect(() => {
    if (!token || !validRequest || freshSignIn || callback) return;
    let cancelled = false;
    void authenticatedRequest<NativeAccount>('native/account').then(
      (result) => {
        if (!cancelled) setAccount({ ...result, token });
      },
      (failure: unknown) => {
        if (!cancelled) setError(t(authErrorKey(failure)));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [token, validRequest, freshSignIn, callback, attempt, t]);
  const connect = async () => {
    if (!request || connecting.current) return;
    connecting.current = true;
    setBusy(true);
    setError('');
    try {
      const { code } = await authenticatedRequest<{ code: string }>(
        'native/authorize',
        request,
      );
      const destination = new URL(request.redirectUri);
      destination.searchParams.set('code', code);
      destination.searchParams.set('state', request.state);
      setCallback(destination.toString());
      window.location.assign(destination.toString());
    } catch (failure) {
      setError(t(authErrorKey(failure)));
    } finally {
      connecting.current = false;
      setBusy(false);
    }
  };
  // Only a completed password/second-factor/enrollment flow may skip confirmation.
  // Restoring or refreshing a browser cookie never calls this callback.
  if (request && !token)
    return (
      <LoginForm
        initialUsername={params.get('login_hint')?.slice(0, 255) ?? ''}
        description={t('nativeAuth.signInDescription')}
        onAuthenticated={() => {
          setFreshSignIn(true);
          void connect();
        }}
      />
    );
  const displayName = account?.name.trim() || account?.username || '';
  const accountReady = account?.token === token;
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
          <Title order={2} ta="center">
            {callback
              ? t('nativeAuth.readyTitle')
              : freshSignIn
                ? t('nativeAuth.connectingTitle')
                : t('nativeAuth.title')}
          </Title>
          {!request ? (
            <Alert color="red" role="alert">
              {t('nativeAuth.invalidRequest')}
            </Alert>
          ) : callback ? (
            <>
              <Text ta="center" c="dimmed">
                {t('nativeAuth.readyDescription')}
              </Text>
              <Button component="a" href={callback}>
                {t('nativeAuth.returnToApp')}
              </Button>
            </>
          ) : (
            <>
              {freshSignIn ? (
                busy ? (
                  <Loader
                    mx="auto"
                    aria-label={t('nativeAuth.connectingTitle')}
                  />
                ) : null
              ) : (
                <>
                  <Text ta="center" c="dimmed">
                    {t('nativeAuth.description')}
                  </Text>
                  {accountReady ? (
                    <Group justify="center" wrap="nowrap" gap="md">
                      <PicrAvatar
                        user={{ name: displayName, gravatar: account.gravatar }}
                        size={56}
                        radius="xl"
                      />
                      <Box miw={0}>
                        <Text fw={600} style={{ overflowWrap: 'anywhere' }}>
                          {displayName}
                        </Text>
                        {account.username &&
                        account.username !== displayName ? (
                          <Text
                            size="sm"
                            c="dimmed"
                            style={{ overflowWrap: 'anywhere' }}
                          >
                            {account.username}
                          </Text>
                        ) : null}
                      </Box>
                    </Group>
                  ) : !error ? (
                    <Loader mx="auto" />
                  ) : null}
                </>
              )}
              {error ? (
                <Alert color="red" role="alert">
                  {error}
                </Alert>
              ) : null}
              {freshSignIn ? (
                error ? (
                  <Button
                    onClick={() => {
                      void connect();
                    }}
                    loading={busy}
                  >
                    {t('nativeAuth.retry')}
                  </Button>
                ) : null
              ) : accountReady ? (
                <Stack gap="xs">
                  <Text
                    size="sm"
                    c="dimmed"
                    ta="center"
                    style={{ overflowWrap: 'anywhere' }}
                  >
                    {new URL(
                      withBasePath(''),
                      window.location.origin,
                    ).toString()}
                  </Text>
                  <Button
                    size="md"
                    loading={busy}
                    onClick={() => {
                      void connect();
                    }}
                  >
                    {t('nativeAuth.continueAs', { name: displayName })}
                  </Button>
                </Stack>
              ) : error ? (
                <Button
                  onClick={() => {
                    setError('');
                    setAttempt(attempt + 1);
                  }}
                >
                  {t('nativeAuth.retry')}
                </Button>
              ) : null}
              {!freshSignIn ? (
                <>
                  <Button
                    variant="subtle"
                    disabled={busy}
                    onClick={() => {
                      setError('');
                      void logoutAdmin().catch((failure: unknown) =>
                        setError(t(authErrorKey(failure))),
                      );
                    }}
                  >
                    {t('nativeAuth.switchAccount')}
                  </Button>
                </>
              ) : null}
              <Button
                variant="subtle"
                color="gray"
                disabled={busy}
                onClick={() => {
                  const destination = new URL(request.redirectUri);
                  destination.searchParams.set('error', 'access_denied');
                  destination.searchParams.set('state', request.state);
                  window.location.assign(destination.toString());
                }}
              >
                {t('security.cancel')}
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </div>
  );
}
