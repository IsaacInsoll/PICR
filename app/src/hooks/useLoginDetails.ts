import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export type LoginDetails = {
  server: string;
  username: string;
  password: string;
  hostname?: string; //auto-calculated when login successful
  token?: string; //auth token
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
  return async (details: LoginDetails) => {
    const payload: LoginDetails = {
      ...details,
      hostname: getHostname(details.server),
    };
    setter(payload);
    await saveLoginDetailsToLocalDevice(payload);
    router.replace('/' + details.hostname);
  };
};

export const useSetLoggedOut = () => {
  const router = useRouter();
  const setter = useSetAtom(loginDetailsAtom);
  return () => {
    setter(undefined);
    router.replace('/login');
  };
};

const getHostname = (str: string): string => {
  return str.replace(/(^\w+:|^)\/\//, '');
};

const saveLoginDetailsToLocalDevice = async (details: LoginDetails) => {
  await SecureStore.setItemAsync('login', JSON.stringify(details));
};

export const getLoginDetailsFromLocalDevice = async (): Promise<
  LoginDetails | undefined
> => {
  const json = await SecureStore.getItemAsync('login');
  if (!json) return undefined;
  return await JSON.parse(json);
};
