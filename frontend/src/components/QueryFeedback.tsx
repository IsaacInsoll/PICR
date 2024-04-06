import { UseQueryState } from 'urql';
import React, { useEffect } from 'react';
import { Notification, Spinner } from 'grommet';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom } from '../atoms/authAtom';

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
      {fetching && <Spinner size="large" />}
      {error && (
        <Notification
          status="critical"
          message={error.toString().replace('[GraphQL] ', '')}
          // onClose={() => setShowGlobalNotification(false)}
          actions={[
            { onClick: reQuery, label: 'Retry' },
            { onClick: logOut, label: 'Log Out' },
          ]}
          global
        />
        //
        // {reQuery && (
        //   <Card.Actions>
        //     <Button onPress={reQuery}>Retry</Button>
        //   </Card.Actions>
        // )}
      )}
    </>
  );
}
