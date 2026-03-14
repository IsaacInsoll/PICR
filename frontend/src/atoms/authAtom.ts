import { atom, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const authKeyAtom = atomWithStorage('authKey', '', undefined, {
  getOnInit: true,
});

const createSessionKey = () => globalThis.crypto.randomUUID();

const sessionKeyAtom = atom<string>(createSessionKey());

export const useSessionKey = () => {
  return useAtomValue(sessionKeyAtom);
};
