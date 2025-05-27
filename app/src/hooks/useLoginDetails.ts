import { atom, useAtomValue, useSetAtom } from 'jotai';

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
  };
};

export const useSetLoggedOut = () => {
  const setter = useSetAtom(loginDetailsAtom);
  return () => {
    setter(undefined);
  };
};
