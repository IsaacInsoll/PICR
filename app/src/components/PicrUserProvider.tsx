import { useLoginDetails, useSetLoggedOut } from '@/src/hooks/useLoginDetails';
import { Redirect } from 'expo-router';
import { Provider } from 'urql';
import { PText } from '@/src/components/PText';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { picrUrqlClient } from '@shared/urql/urqlClient';
import * as Application from 'expo-application';
import { AppState, Button, Platform, View } from 'react-native';
import { pushGlobalError } from '@/src/atoms/globalErrorAtom';
import { createAuthenticatedServerOrigin } from '@/src/helpers/authenticatedServerOrigin';
import { AuthenticatedServerOriginProvider } from '@/src/components/AuthenticatedServerOriginProvider';
import {
  appSessionIdentity,
  expireAppSession,
  refreshAppSession,
  restoreAppSession,
} from '@/src/helpers/appSession';
import { createAppAuthExchanges } from '@/src/helpers/appAuthExchange';
import { nativeAuthErrorMessage } from '@/src/helpers/nativeAuthRequest';

export const PicrUserProvider = ({ children }: { children: ReactNode }) => {
  const me = useLoginDetails();
  const logout = useSetLoggedOut();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      try {
        await restoreAppSession();
        await refreshAppSession();
        if (!cancelled) {
          setReady(true);
          setError('');
        }
      } catch (failure) {
        if (!cancelled) {
          setReady(true);
          setError(nativeAuthErrorMessage(failure));
        }
      }
    };
    void restore();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void restore();
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [attempt]);
  const origin = useMemo(
    () =>
      me
        ? createAuthenticatedServerOrigin({
            server: me.server,
            token: me.token,
            userAgent: `${Application.applicationName} ${Platform.OS} ${Application.nativeApplicationVersion} (Build ${Application.nativeBuildVersion})`,
          })
        : null,
    [me],
  );
  const server = origin?.baseUrl;
  const identity = me ? appSessionIdentity(me.token) : '';
  // Session identity is stable through refresh, preserving Graphcache and open screens.
  const client = useMemo(
    () =>
      server
        ? picrUrqlClient(
            server,
            {
              'user-agent': `${Application.applicationName} ${Platform.OS} ${Application.nativeApplicationVersion} (Build ${Application.nativeBuildVersion})`,
            },
            {
              onGlobalError: pushGlobalError,
              onAuthExpired: () => {
                void expireAppSession(identity).catch((failure: unknown) =>
                  setError(nativeAuthErrorMessage(failure)),
                );
              },
              authExchanges: createAppAuthExchanges(identity),
            },
          )
        : null,
    [server, identity],
  );
  if (!ready) return <PText>Restoring your session…</PText>;
  if (!me) return <Redirect href="/login" />;
  if (error)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        <PText>{error}</PText>
        <Button
          title="Try again"
          onPress={() => {
            setReady(false);
            setError('');
            setAttempt(attempt + 1);
          }}
        />
        <Button
          title="Sign out"
          onPress={() => {
            void logout();
          }}
        />
      </View>
    );
  if (!origin || !client) return <PText>Restoring your session…</PText>;
  return (
    <AuthenticatedServerOriginProvider origin={origin}>
      <Provider value={client}>{children}</Provider>
    </AuthenticatedServerOriginProvider>
  );
};
