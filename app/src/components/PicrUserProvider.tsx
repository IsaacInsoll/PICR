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
import { atom, useAtom, useSetAtom } from 'jotai';
import { appLogin } from '@/src/helpers/appLogin';
import { picrUrqlClient } from '@shared/urql/urqlClient';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { usePathname } from 'expo-router/build/hooks';

const initCompleteAtom = atom(false); // we only want this once system-wide, not per instance of this provider

let publicUserPath: false | { uuid: string; server: string } = false;
export const isPublicLinkAtom = atom(false);

const useIsPublicUserPath = (): false | { uuid: string; server: string } => {
  const paths = usePathname().split('/');

  const isPublic = paths.length > 3 && paths[2] == 's'; // leading forwardslash is first segment
  if (!isPublic) return false;

  const server = 'https://' + paths[1] + '/';
  const uuid = paths[3];

  if (publicUserPath) {
    if (publicUserPath.uuid == uuid && publicUserPath.server == server)
      return publicUserPath;
  }
  publicUserPath = { server, uuid };
  return publicUserPath;
};

export const PicrUserProvider = ({ children }: { children: ReactNode }) => {
  const isPublic = useIsPublicUserPath();
  const [initComplete, setInitComplete] = useAtom(initCompleteAtom);
  const me = useLoginDetails();
  const setLogin = useSetLoginDetails();
  const logout = useSetLoggedOut();
  const setPublic = useSetAtom(isPublicLinkAtom);

  // console.log('PicrUserProvider: ' + me?.username + ' ' + pathName);

  useEffect(() => {
    if (initComplete || isPublic) return;
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
    if (isPublic) {
      console.log(
        'PicrUserProvider: _creating_ public URQL client for ' +
          isPublic.uuid +
          ' at ' +
          isPublic.server,
      );
      setPublic(true);
      return picrUrqlClient(isPublic.server, {
        uuid: isPublic.uuid,
        'user-agent': `${Application.applicationName} ${Platform.OS} ${Application.nativeApplicationVersion} (Build ${Application.nativeBuildVersion})`,
      });
    }
    if (!me) return null;
    console.log(
      'PicrUserProvider: _creating_ URQL client for ' +
        me.username +
        ' at ' +
        me.server,
    );
    setPublic(false);
    return picrUrqlClient(me.server, {
      authorization: `Bearer ${me.token}`,
      'user-agent': `${Application.applicationName} ${Platform.OS} ${Application.nativeApplicationVersion} (Build ${Application.nativeBuildVersion})`,
    });
  }, [me?.server, me?.token, isPublic]);

  if (!initComplete) return <PText>Loading...</PText>;
  if (!me) {
    console.log('PicrUserProvider: not logged in, redirecting');
    return <Redirect href="/login" />;
  }

  console.log('PicrUserProvider: returning URQL client');
  return <Provider value={client}>{children}</Provider>;
};
