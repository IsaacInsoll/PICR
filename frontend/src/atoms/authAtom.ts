import { useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const authKeyAtom = atomWithStorage('authKey', '');

// export const useIsLoggedIn = () => {
//   const token = useAtomValue(authKeyAtom);
//   console.log('recalc useIsLoggedIn');
//   return token !== '';
// };
