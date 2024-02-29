import { UseQueryState } from 'urql';
import React from 'react';
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

  console.log(result);
  return (
    <>
      {fetching && <Spinner size="large" />}
      {error && (
        <Notification
          status="critical"
          message={error.toString()}
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