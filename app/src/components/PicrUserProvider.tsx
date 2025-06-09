import { ReactNode, useEffect, useState } from 'react';
import {
  getLoginDetailsFromLocalDevice,
  useLoginDetails,
  useSetLoginDetails,
} from '@/src/hooks/useLoginDetails';
import { Redirect } from 'expo-router';
import { urqlClient } from '@/src/urqlClient';
import { Provider } from 'urql';
import { PText } from '@/src/components/PText';
import { atom, useAtom } from 'jotai';
import { usePathname } from 'expo-router/build/hooks';

const initCompleteAtom = atom(false); // we only want this once system-wide, not per instance of this provider

export const PicrUserProvider = ({ children }: { children: ReactNode }) => {
  const [initComplete, setInitComplete] = useAtom(initCompleteAtom);
  const me = useLoginDetails();
  const setLogin = useSetLoginDetails();

  // console.log('PicrUserProvider: ' + me?.username + ' ' + pathName);

  useEffect(() => {
    if (initComplete) return;
    console.log('getting login details from local storage');
    getLoginDetailsFromLocalDevice().then((login) => {
      if (login) {
        setLogin(login);
      }
      setInitComplete(true);
    });
  }, []);
  if (!initComplete) return <PText>Loading...</PText>;
  if (!me) {
    console.log('PicrUserProvider: not logged in, redirecting');
    return <Redirect href="/login" />;
  }
  console.log('PicrUserProvider: creating URQL client');
  const client = urqlClient(me.server, { authorization: `Bearer ${me.token}` });
  return <Provider value={client}>{children}</Provider>;
};
