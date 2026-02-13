import { CombinedError, UseQueryState } from 'urql';
import React from 'react';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom } from '../atoms/authAtom';
import { LoadingIndicator } from './LoadingIndicator';
import { Alert, Button } from '@mantine/core';
import { AlertIcon } from '../PicrIcons';
import {
  classifyGlobalUrqlError,
  isAuthExpiredError,
} from '@shared/urql/errorClassification';

interface QueryFeedbackProps {
  result: UseQueryState;
  reQuery: () => void;
}
export default function QueryFeedback({ result, reQuery }: QueryFeedbackProps) {
  const { fetching, error } = result;
  const setAuthKey = useSetAtom(authKeyAtom);
  const logOut = () => {
    setAuthKey('');
  };

  const isGlobalError = classifyGlobalUrqlError(error as CombinedError);
  const isAuthExpired = isAuthExpiredError(error as CombinedError);

  return (
    <>
      {fetching && <LoadingIndicator size="large" />}
      {error && !isGlobalError && !isAuthExpired && (
        <Alert variant="light" color="red" title="Error" icon={<AlertIcon />}>
          {error.toString().replace('[GraphQL] ', '')}
          <Button onClick={reQuery}>Retry</Button>
          <Button onClick={logOut}>Log Out</Button>
        </Alert>
      )}
    </>
  );
}
