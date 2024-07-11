import { UseQueryState } from 'urql';
import React, { useEffect } from 'react';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom } from '../atoms/authAtom';
import { LoadingIndicator } from './LoadingIndicator';
import { Alert, Button } from '@mantine/core';
import { TbExclamationCircle } from 'react-icons/tb';

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

  useEffect(() => {
    if (error?.message === '[GraphQL] AUTH: Not Logged In') {
      setAuthKey('');
    }
  }, [error?.message, setAuthKey]);

  // console.log(result);
  return (
    <>
      {fetching && <LoadingIndicator size="large" />}
      {error && (
        <Alert
          variant="light"
          color="red"
          title="Alert title"
          icon={<TbExclamationCircle />}
        >
          {error.toString().replace('[GraphQL] ', '')}
          <Button onClick={reQuery}>Retry</Button>
          <Button onClick={logOut}>Log Out</Button>
        </Alert>
      )}
    </>
  );
}
