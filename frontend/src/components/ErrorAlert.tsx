import { Alert, Transition } from '@mantine/core';
import { WarningIcon } from '../PicrIcons';
import { ReactNode } from 'react';

export interface ErrorAlertProps {
  message: string | null;
  title?: string;
}

export const ErrorAlert = ({ message, title }: ErrorAlertProps) => {
  const visible = !!message;
  return (
    <Transition
      mounted={visible}
      transition="pop"
      duration={400}
      timingFunction="ease"
    >
      {(styles) => (
        <Alert
          style={styles}
          variant="filled"
          color="red"
          title={title ?? 'Error'}
          icon={<WarningIcon />}
        >
          {message?.replace('[GraphQL] ', '')}
        </Alert>
      )}
    </Transition>
  );
};
