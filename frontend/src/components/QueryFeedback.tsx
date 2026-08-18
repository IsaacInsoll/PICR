import type { CombinedError, UseQueryState } from 'urql';
import { useSetAtom } from 'jotai';
import { authKeyAtom } from '../atoms/authAtom';
import { LoadingIndicator } from './LoadingIndicator';
import { Alert, Button } from '@mantine/core';
import { AlertIcon } from '../PicrIcons';
import {
  classifyGlobalUrqlError,
  isAuthExpiredError,
} from '@shared/urql/errorClassification';
import { useTranslation } from 'react-i18next';

interface QueryFeedbackProps {
  result: UseQueryState;
  reQuery: () => void;
}
export default function QueryFeedback({ result, reQuery }: QueryFeedbackProps) {
  const { t } = useTranslation('gallery');
  const { fetching, data, error } = result;
  const setAuthKey = useSetAtom(authKeyAtom);
  const logOut = () => {
    setAuthKey('');
  };

  const isGlobalError = classifyGlobalUrqlError(error as CombinedError);
  const isAuthExpired = isAuthExpiredError(error as CombinedError);

  return (
    <>
      {fetching && !data && <LoadingIndicator size="large" />}
      {error && !isGlobalError && !isAuthExpired && (
        <Alert
          variant="light"
          color="red"
          title={t('error.generic')}
          icon={<AlertIcon />}
        >
          {error.toString().replace('[GraphQL] ', '')}
          <Button onClick={reQuery}>{t('error.retry')}</Button>
          <Button onClick={logOut}>{t('error.logOut')}</Button>
        </Alert>
      )}
    </>
  );
}
