import { ReactNode } from 'react';
import { useLoginDetails } from '@/src/hooks/useLoginDetails';
import { Redirect } from 'expo-router';
import { urqlClient } from '@/src/urqlClient';
import { Provider } from 'urql';

// Basically forces a login screen if you aren't logged in
export const PicrUserProvider = ({ children }: { children: ReactNode }) => {
  const me = useLoginDetails();
  if (!me) {
    console.log('PicrUserProvider: not logged in, redirecting');
    return <Redirect href="/login" />;
  }
  console.log('PicrUserProvider: creating URQL client');
  //TODO: get auth token and push it through here as a header, else redirect to login
  const client = urqlClient(me.server, { authorization: `Bearer ${me.token}` });

  return <Provider value={client}>{children}</Provider>;
};
