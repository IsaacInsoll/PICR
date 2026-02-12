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
import { pushGlobalError } from '@shared/globalErrorAtom';

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

export const PicrPublicUserProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const isPublic = useIsPublicUserPath();
  const me = useLoginDetails();
  const setPublic = useSetAtom(isPublicLinkAtom);

  const client = useMemo(() => {
    if (isPublic) {
      console.log(
        'PicrPublicUserProvider: _creating_ public URQL client for ' +
          isPublic.uuid +
          ' at ' +
          isPublic.server,
      );
      setPublic(true);
      return picrUrqlClient(isPublic.server, {
        uuid: isPublic.uuid,
        'user-agent': `${Application.applicationName} ${Platform.OS} ${Application.nativeApplicationVersion} (Build ${Application.nativeBuildVersion})`,
      }, {
        onGlobalError: pushGlobalError,
      });
    }
  }, [me?.server, me?.token, isPublic]);

  console.log('PicrPublicUserProvider: returning URQL client');
  return <Provider value={client}>{children}</Provider>;
};
