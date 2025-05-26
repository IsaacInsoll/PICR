import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'expo-router';

export type LoginDetails = {
  server: string;
  username: string;
  password: string;
};

const loginDetailsAtom = atom<LoginDetails | undefined>(undefined);

export const useLoginDetails = () => {
  return useAtomValue(loginDetailsAtom);
};

export const useSetLoginDetails = () => {
  const setter = useSetAtom(loginDetailsAtom);
  return (details: LoginDetails) => {
    setter(details);
    console.log('set Login details', details);
  };
};

export const useSetLoggedOut = () => {
  const setter = useSetAtom(loginDetailsAtom);
  return () => {
    const router = useRouter();
    setter(undefined);
    console.log('logged out, redirecting');
    router.replace('/login');
  };
};
