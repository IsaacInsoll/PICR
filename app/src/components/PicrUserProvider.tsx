import { ReactNode, useEffect, useMemo } from 'react';
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

const initCompleteAtom = atom(false); // we only want this once system-wide, not per instance of this provider

export const PicrUserProvider = ({ children }: { children: ReactNode }) => {
  const [initComplete, setInitComplete] = useAtom(initCompleteAtom);
  const me = useLoginDetails();
  const setLogin = useSetLoginDetails();
  const logout = useSetLoggedOut();

  // console.log('PicrUserProvider: ' + me?.username + ' ' + pathName);

  useEffect(() => {
    if (initComplete) return;
    console.log('getting login details from local storage');
    getLoginDetailsFromLocalDevice().then((login) => {
      if (login) {
        setLogin(login);
        //this could be a super old token, so lets trigger a non-inline refresh just in case
        appLogin(login).then(({ token, error }) => {
          if (token) {
            console.log('[PicrUserProvider] Updating token');
            setLogin({ ...login, token });
          } else {
            logout();
          }
        });
      }
      setInitComplete(true);
    });
  }, []);
  const client = useMemo(() => {
    if (!me) return null;
    console.log('PicrUserProvider: _creating_ URQL client');
    return picrUrqlClient(me.server, {
      authorization: `Bearer ${me.token}`,
      'user-agent': `${Application.applicationName} ${Platform.OS} ${Application.nativeApplicationVersion} (Build ${Application.nativeBuildVersion})`,
    });
  }, [me?.server, me?.token]);

  if (!initComplete) return <PText>Loading...</PText>;
  if (!me) {
    console.log('PicrUserProvider: not logged in, redirecting');
    return <Redirect href="/login" />;
  }

  console.log('PicrUserProvider: returning URQL client');
  return <Provider value={client}>{children}</Provider>;
};
