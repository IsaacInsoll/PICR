import type {
  GlobalErrorReason,
  GlobalErrorType,
} from '@shared/urql/errorClassification';
import { atom, getDefaultStore } from 'jotai';

export interface GlobalErrorIncident {
  id: number;
  type: GlobalErrorType;
  reason?: GlobalErrorReason;
  diagnosticMessage?: string;
  operationName?: string;
  operationKind?: string;
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
