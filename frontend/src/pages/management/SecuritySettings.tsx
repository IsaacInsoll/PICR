import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { AdminSecurityStatus } from '@shared/auth/adminAuth';
import {
  authenticatedRequest,
  setAdminAccessToken,
} from '../../helpers/adminSession';
import { authErrorKey } from '../../helpers/authErrorKey';
import {
  AuthenticatorEnrollment,
  RecoveryCodes,
} from './AuthenticatorEnrollment';

type Action = 'enroll' | 'disable' | 'recovery' | 'policy';
export const SecuritySettings = () => {
  const { t } = useTranslation('admin');
  const [status, setStatus] = useState<AdminSecurityStatus | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [mustSave, setMustSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      setStatus(await authenticatedRequest<AdminSecurityStatus>('security'));
    } catch (error) {
      setError(t(authErrorKey(error)));
    }
  };
  useEffect(() => {
    let cancelled = false;
    void authenticatedRequest<AdminSecurityStatus>('security')
      .then((value) => {
        if (!cancelled) setStatus(value);
      })
      .catch((error) => {
        if (!cancelled) setError(t(authErrorKey(error)));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);
  const close = () => {
    setAction(null);
    setMustSave(false);
    setPassword('');
    setCode('');
    setError('');
    void load();
  };
  const change = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await authenticatedRequest<{
        accessToken?: string;
        recoveryCodes: string[];
      }>('change', { action, password, code, required: !status?.required });
      if (result.accessToken) setAdminAccessToken(result.accessToken);
      setCodes(result.recoveryCodes);
      close();
    } catch (error) {
      setError(t(authErrorKey(error)));
      setCode('');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Stack maw={720} mt="xl" gap="lg">
      <Title order={2}>{t('security.title')}</Title>
      {error && !action ? <Alert color="red">{error}</Alert> : null}
      {status ? (
        <>
          {!status.available ? (
            <Alert color="yellow" title={t('security.configurationTitle')}>
              {t('security.configurationDescription')}
            </Alert>
          ) : null}
          <Paper withBorder p="lg" radius="md">
            <Stack>
              <Group justify="space-between">
                <Title order={3}>{t('security.authenticator')}</Title>
                <Badge color={status.enabled ? 'green' : 'gray'}>
                  {status.enabled
                    ? t('security.enabled')
                    : t('security.disabled')}
                </Badge>
              </Group>
              <Text c="dimmed" size="sm">
                {t('security.accountDescription')}
              </Text>
              {status.enabled ? (
                <>
                  <Text size="sm">
                    {t('security.remainingCodes', {
                      count: status.recoveryCodesRemaining,
                    })}
                  </Text>
                  <Group>
                    <Button
                      variant="light"
                      disabled={!status.available}
                      onClick={() => setAction('recovery')}
                    >
                      {t('security.regenerate')}
                    </Button>
                    <Button
                      variant="subtle"
                      color="red"
                      disabled={status.required || !status.available}
                      onClick={() => setAction('disable')}
                    >
                      {t('security.disable')}
                    </Button>
                  </Group>
                </>
              ) : (
                <Button
                  disabled={!status.available}
                  onClick={() => setAction('enroll')}
                >
                  {t('security.enable')}
                </Button>
              )}
            </Stack>
          </Paper>
          {status.canManagePolicy ? (
            <Paper withBorder p="lg" radius="md">
              <Stack>
                <Group justify="space-between">
                  <Title order={3}>{t('security.policyTitle')}</Title>
                  <Badge>
                    {status.required
                      ? t('security.required')
                      : t('security.optional')}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {t('security.policyDescription')}
                </Text>
                <Text size="sm">
                  {t('security.unenrolled', { count: status.unenrolledAdmins })}
                </Text>
                {!status.enabled ? (
                  <Text size="sm">{t('security.enrollBeforeEnforcement')}</Text>
                ) : null}
                <Button
                  variant="light"
                  disabled={!status.available || !status.enabled}
                  onClick={() => setAction('policy')}
                >
                  {status.required
                    ? t('security.makeOptional')
                    : t('security.requireAll')}
                </Button>
              </Stack>
            </Paper>
          ) : null}
        </>
      ) : (
        <Text c="dimmed">{t('security.loading')}</Text>
      )}
      {action ? (
        <Modal
          opened={true}
          onClose={() => {
            if (!mustSave) close();
          }}
          withCloseButton={!mustSave}
          closeOnClickOutside={!mustSave}
          closeOnEscape={!mustSave}
          title={t('security.title')}
          closeButtonProps={{ 'aria-label': t('security.cancel') }}
          centered
        >
          {action === 'enroll' ? (
            <AuthenticatorEnrollment
              onCancel={close}
              onComplete={close}
              onRecoveryReady={() => setMustSave(true)}
            />
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void change();
              }}
            >
              <Stack>
                <Alert color={action === 'disable' ? 'yellow' : 'blue'}>
                  {action === 'policy'
                    ? t('security.policyConfirmation', {
                        count: status?.unenrolledAdmins ?? 0,
                      })
                    : t('security.changeConfirmation')}
                </Alert>
                <PasswordInput
                  required
                  autoComplete="current-password"
                  label={t('login.password')}
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                />
                <TextInput
                  required
                  autoComplete="one-time-code"
                  label={t('security.codeOrRecovery')}
                  value={code}
                  onChange={(event) => setCode(event.currentTarget.value)}
                />
                {error ? (
                  <Alert color="red" role="alert">
                    {error}
                  </Alert>
                ) : null}
                <Button type="submit" loading={busy}>
                  {t('security.confirm')}
                </Button>
              </Stack>
            </form>
          )}
        </Modal>
      ) : null}
      {codes.length > 0 ? (
        <Modal
          opened={true}
          onClose={() => undefined}
          withCloseButton={false}
          closeOnClickOutside={false}
          closeOnEscape={false}
          centered
          title={t('security.recoveryTitle')}
        >
          <RecoveryCodes codes={codes} onDone={() => setCodes([])} />
        </Modal>
      ) : null}
    </Stack>
  );
};
