import { atom, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const authKeyAtom = atomWithStorage('authKey', '', undefined, {
  getOnInit: true,
});

const createSessionKey = () =>
  globalThis.crypto?.randomUUID?.() ??
  Math.floor(Math.random() * Date.now()).toString(16);

const sessionKeyAtom = atom<string>(createSessionKey());

export const useSessionKey = () => {
  return useAtomValue(sessionKeyAtom) ?? '';
};
