import { Alert, Transition } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { stripUrqlErrorPrefixes } from '@shared/urql/stripUrqlErrorPrefixes';
import { WarningIcon } from '../PicrIcons';

export interface ErrorAlertProps {
  message: string | null;
  title?: string;
}

export const ErrorAlert = ({ message, title }: ErrorAlertProps) => {
  const { t } = useTranslation('admin');
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
          title={title ?? t('common.error')}
          icon={<WarningIcon />}
        >
          {message ? stripUrqlErrorPrefixes(message) : null}
        </Alert>
      )}
    </Transition>
  );
};
