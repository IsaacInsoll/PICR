import { atom, useAtomValue } from 'jotai';

const meAtom = atom(false);

export const useMe = () => {
  const me = useAtomValue(meAtom);
  return me;
};
