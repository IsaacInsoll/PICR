import { atomWithStorage } from 'jotai/utils';
import { atom, useAtom } from 'jotai';

export const authKeyAtom = atomWithStorage('authKey', '', undefined, {
  getOnInit: true,
});

const sessionKeyAtom = atom<string | null>();

export const useSessionKey = () => {
  const [sessionKey, setSessionKey] = useAtom(sessionKeyAtom);
  if (!sessionKey) {
    const key = Math.floor(Math.random() * Date.now()).toString(16);
    setSessionKey(key);
    return key;
  }
  return sessionKey;
};
