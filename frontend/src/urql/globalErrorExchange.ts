import {
  classifyGlobalUrqlError,
  isAuthExpiredError,
} from '@shared/urql/errorClassification';
import { pushGlobalError } from '@shared/globalErrorAtom';
import { authKeyAtom } from '../atoms/authAtom';
import { getDefaultStore } from 'jotai';
import type { Exchange } from 'urql';
import { pipe, tap } from 'wonka';

export const globalErrorExchange: Exchange =
  ({ forward }) =>
  (ops$) =>
    pipe(
      forward(ops$),
      tap((result) => {
        if (isAuthExpiredError(result.error)) {
          getDefaultStore().set(authKeyAtom, '');
          return;
        }
        const match = classifyGlobalUrqlError(result.error);
        if (!match) return;
        pushGlobalError(match);
      }),
    );
