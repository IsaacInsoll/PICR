import { atom, useAtom } from 'jotai';

const quickFindOpenAtom = atom(false);

export const useQuickFind = () => {
  return useAtom(quickFindOpenAtom);
};
