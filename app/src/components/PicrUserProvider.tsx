import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import {
  getLoginDetailsFromLocalDevice,
  useLoginDetails,
  useSetLoggedOut,
  useSetLoginDetails,
} from '@/src/hooks/useLoginDetails';
import { Redirect } from 'expo-router';
import { Provider } from 'urql';
import { PText } from '@/src/components/PText';
import { atom, useAtom } from 'jotai';
import { appLogin } from '@/src/helpers/appLogin';
import { picrUrqlClient } from '@shared/urql/urqlClient';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { pushGlobalError } from '@/src/atoms/globalErrorAtom';
import { clearAppAuth } from '@/src/helpers/clearAppAuth';
import { createAuthenticatedServerOrigin } from '@/src/helpers/authenticatedServerOrigin';
import { AuthenticatedServerOriginProvider } from '@/src/components/AuthenticatedServerOriginProvider';

const initCompleteAtom = atom(false); // we only want this once system-wide, not per instance of this provider

export const PicrUserProvider = ({ children }: { children: ReactNode }) => {
  const [initComplete, setInitComplete] = useAtom(initCompleteAtom);
  const me = useLoginDetails();
  const setLogin = useSetLoginDetails();
  const logout = useSetLoggedOut();

  // console.log('PicrUserProvider: ' + me?.username + ' ' + pathName);

  useEffect(() => {
    if (initComplete) return;
    // console.log('getting login details from local storage');
    void getLoginDetailsFromLocalDevice().then((login) => {
      if (login) {
        void setLogin(login);
        //this could be a super old token, so lets trigger a non-inline refresh just in case
        void appLogin(login).then(({ token }) => {
          if (token) {
            // console.log('[PicrUserProvider] Updating token');
            void setLogin({ ...login, token });
          } else {
            void logout();
          }
        });
      }
      setInitComplete(true);
    });
  }, [initComplete, logout, setInitComplete, setLogin]);
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
  const client = useMemo(() => {
    if (!origin) return null;
    // console.log('PicrUserProvider: _creating_ URQL client');
    return picrUrqlClient(origin.baseUrl, origin.requestHeaders, {
      onGlobalError: pushGlobalError,
      onAuthExpired: clearAppAuth,
    });
  }, [origin]);

  if (!initComplete) return <PText>Loading...</PText>;
  if (!me) {
    // console.log('PicrUserProvider: not logged in, redirecting');
    return <Redirect href="/login" />;
  }
  if (!origin || !client) return <PText>Loading...</PText>;

  // console.log('PicrUserProvider: returning URQL client');
  return (
    <AuthenticatedServerOriginProvider origin={origin}>
      <Provider value={client}>{children}</Provider>
    </AuthenticatedServerOriginProvider>
  );
};
