import {
  classifyGlobalUrqlError,
  isAuthExpiredError,
  isPublicLinkExpiredError,
} from '@shared/urql/errorClassification';
import { pushGlobalError } from '@shared/globalErrorAtom';
import { authKeyAtom } from '../atoms/authAtom';
import { getDefaultStore } from 'jotai';
import { Kind, type OperationDefinitionNode } from 'graphql';
import type { Exchange, OperationResult } from 'urql';
import { pipe, tap } from 'wonka';
import { getUUID } from '../helpers/getUUID';
import { reportExpiredPublicLink } from '../atoms/publicLinkAccessAtom';

const getOperationMetadata = (result: OperationResult) => {
  const definition = result.operation.query.definitions.find(
    (entry): entry is OperationDefinitionNode =>
      entry.kind === Kind.OPERATION_DEFINITION,
  );

  return {
    operationName: definition?.name?.value,
    operationKind: result.operation.kind,
  };
};

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
        if (isPublicLinkExpiredError(result.error)) {
          const uuid = getUUID();
          if (uuid) {
            reportExpiredPublicLink(uuid);
            return;
          }
        }
        const match = classifyGlobalUrqlError(result.error);
        if (!match) return;
        pushGlobalError({ ...match, ...getOperationMetadata(result) });
      }),
    );
