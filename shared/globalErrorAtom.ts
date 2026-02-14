import { atom, getDefaultStore } from 'jotai';
import type { GlobalErrorType } from './urql/errorClassification';

export interface GlobalErrorIncident {
  id: number;
  type: GlobalErrorType;
  message: string;
}

export const globalErrorAtom = atom<GlobalErrorIncident | null>(null);

const store = getDefaultStore();
let nextIncidentId = 1;

export const pushGlobalError = (
  error: Omit<GlobalErrorIncident, 'id'>,
): boolean => {
  if (store.get(globalErrorAtom)) return false;
  store.set(globalErrorAtom, { ...error, id: nextIncidentId++ });
  return true;
};

export const clearGlobalError = () => {
  store.set(globalErrorAtom, null);
};
