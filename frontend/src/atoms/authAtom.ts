import { atomWithStorage } from 'jotai/utils';

export const authKeyAtom = atomWithStorage('authKey', '', window.localStorage, {
  getOnInit: true,
});
