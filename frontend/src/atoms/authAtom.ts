import { atomWithStorage } from 'jotai/utils';

export const authKeyAtom = atomWithStorage('authKey', '', undefined, {
  getOnInit: true,
});
