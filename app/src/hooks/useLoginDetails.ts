import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'expo-router';

export type LoginDetails = {
  server: string;
  username: string;
  password: string;
  hostname?: string; //auto-calculated when login successful
};

const loginDetailsAtom = atom<LoginDetails | undefined>(undefined);

export const useLoginDetails = () => {
  const details = useAtomValue(loginDetailsAtom);
  if (!details) return undefined;
  return {
    ...details,
    hostname: details.server.replace(/(^\w+:|^)\/\//, ''),
  };
};

export const useSetLoginDetails = () => {
  const router = useRouter();
  const setter = useSetAtom(loginDetailsAtom);
  return (details: LoginDetails) => {
    setter({ ...details, hostname: getHostname(details.server) });
    router.replace('/' + details.hostname);
  };
};

export const useSetLoggedOut = () => {
  const setter = useSetAtom(loginDetailsAtom);
  return () => {
    setter(undefined);
  };
};

const getHostname = (str: string): string => {
  return str.replace(/(^\w+:|^)\/\//, '');
};
