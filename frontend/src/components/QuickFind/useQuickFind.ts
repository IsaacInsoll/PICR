import { atom, useAtom } from 'jotai/index';

const quickFindOpenAtom = atom(false);

export const useQuickFind = () => {
  return useAtom(quickFindOpenAtom);
};
