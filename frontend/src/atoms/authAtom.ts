import { atom, useAtomValue, useSetAtom } from 'jotai';

export const authKeyAtom = atom('');

export const useIsLoggedIn = () => {
  const token = useAtomValue(authKeyAtom);
  return token !== '';
};
