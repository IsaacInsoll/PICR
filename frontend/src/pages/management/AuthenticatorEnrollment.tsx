import { useState } from 'react';
import classes from '../LoginForm.module.css';
import {
  Alert,
  Button,
  Checkbox,
  Code,
  CopyButton,
  Group,
  Image,
  Paper,
  PasswordInput,
  PinInput,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  Title,
} from '@mantine/core';
import { MdCheckCircleOutline } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import type {
  AdminAuthResult,
  AuthenticatorSetup,
} from '@shared/auth/adminAuth';
import {
  acceptAdminSession,
  authenticatedRequest,
  authRequest,
} from '../../helpers/adminSession';
import { authErrorKey } from '../../helpers/authErrorKey';

export const RecoveryCodes = ({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) => {
  const { t } = useTranslation('admin');
  const [saved, setSaved] = useState(false);
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([`${t('security.recoveryTitle')}\n\n${codes.join('\n')}\n`], {
        type: 'text/plain',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'picr-recovery-codes.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Stack className={classes.step}>
      <Group>
        <MdCheckCircleOutline size={28} />
        <Title order={3}>{t('security.recoveryTitle')}</Title>
      </Group>
      <Alert color="yellow">{t('security.saveRecoveryDescription')}</Alert>
      <Paper p="md" withBorder>
        <SimpleGrid cols={{ base: 1, xs: 2 }}>
          {codes.map((code) => (
            <Code key={code}>{code}</Code>
          ))}
        </SimpleGrid>
      </Paper>
      <Group grow>
        <CopyButton value={codes.join('\n')}>
          {({ copied, copy }) => (
            <Button variant="light" onClick={copy}>
              {copied ? t('security.copied') : t('security.copyCodes')}
            </Button>
          )}
        </CopyButton>
        <Button variant="light" onClick={download}>
          {t('security.downloadCodes')}
        </Button>
      </Group>
      <Checkbox
        label={t('security.savedCodes')}
        checked={saved}
        onChange={(event) => setSaved(event.currentTarget.checked)}
      />
      <Button onClick={onDone} disabled={!saved}>
        {t('security.done')}
      </Button>
    </Stack>
  );
};

export const AuthenticatorEnrollment = ({
  challenge,
  onCancel,
  onComplete,
  onRecoveryReady,
}: {
  challenge?: string;
  onCancel: () => void;
  onComplete?: () => void;
  onRecoveryReady?: () => void;
}) => {
  const { t } = useTranslation('admin');
  const [password, setPassword] = useState('');
  const [setup, setSetup] = useState<AuthenticatorSetup | null>(null);
  const [code, setCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [result, setResult] = useState<
    | (Extract<AdminAuthResult, { accessToken: string }> & {
        recoveryCodes: string[];
      })
    | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = <T,>(path: string, body: object) =>
    challenge
      ? authRequest<T>(path, body, `Enrollment ${challenge}`)
      : authenticatedRequest<T>(path, body);
  const begin = async () => {
    setBusy(true);
    setError('');
    try {
      setSetup(await request<AuthenticatorSetup>('setup', { password }));
      setPassword('');
    } catch (error) {
      setError(t(authErrorKey(error)));
    } finally {
      setBusy(false);
    }
  };
  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      setResult(
        await request<
          Extract<AdminAuthResult, { accessToken: string }> & {
            recoveryCodes: string[];
          }
        >('confirm', { code }),
      );
      setSetup(null);
      onRecoveryReady?.();
    } catch (error) {
      setError(t(authErrorKey(error)));
      setCode('');
    } finally {
      setBusy(false);
    }
  };
  if (result)
    return (
      <RecoveryCodes
        codes={result.recoveryCodes}
        onDone={() => {
          acceptAdminSession(result);
          onComplete?.();
        }}
      />
    );
  return (
    <Stack
      gap="lg"
      key={setup ? 'connect' : 'prepare'}
      className={classes.step}
    >
      <Title order={3}>{t('security.setupTitle')}</Title>
      {challenge ? <Alert>{t('security.enrollmentRequired')}</Alert> : null}
      <Stepper active={setup ? 1 : 0} size="xs" allowNextStepsSelect={false}>
        <Stepper.Step label={t('security.prepare')} />
        <Stepper.Step label={t('security.connect')} />
        <Stepper.Step label={t('security.saveCodes')} />
      </Stepper>
      {setup ? (
        <>
          <Text size="sm" c="dimmed">
            {t('security.scanDescription')}
          </Text>
          <Image
            src={setup.qrCode}
            alt={t('security.qrAlt')}
            w={220}
            mx="auto"
            radius="md"
          />
          <Button variant="subtle" onClick={() => setShowSecret(!showSecret)}>
            {showSecret ? t('security.hideKey') : t('security.viewKey')}
          </Button>
          {showSecret ? (
            <Stack gap="xs">
              <Code
                block
                style={{ overflowWrap: 'anywhere', whiteSpace: 'normal' }}
              >
                {setup.secret}
              </Code>
              <CopyButton value={setup.secret}>
                {({ copied, copy }) => (
                  <Button variant="light" onClick={copy}>
                    {copied ? t('security.copied') : t('security.copyKey')}
                  </Button>
                )}
              </CopyButton>
            </Stack>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void confirm();
            }}
          >
            <Stack align="center">
              <Text size="sm">{t('security.authenticatorCode')}</Text>
              <PinInput
                gap={4}
                length={6}
                type="number"
                oneTimeCode
                autoFocus
                value={code}
                onChange={setCode}
                aria-label={t('security.authenticatorCode')}
              />
              <Button
                fullWidth
                type="submit"
                loading={busy}
                disabled={code.length !== 6}
              >
                {t('security.enable')}
              </Button>
            </Stack>
          </form>
        </>
      ) : (
        <>
          <Text c="dimmed" size="sm">
            {t('security.setupDescription')}
          </Text>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void begin();
            }}
          >
            <Stack>
              {!challenge ? (
                <PasswordInput
                  required
                  label={t('login.password')}
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.currentTarget.value)}
                />
              ) : null}
              <Button type="submit" loading={busy}>
                {t('security.begin')}
              </Button>
            </Stack>
          </form>
        </>
      )}
      {error ? (
        <Alert color="red" role="alert">
          {error}
        </Alert>
      ) : null}
      <Button variant="subtle" color="gray" onClick={onCancel}>
        {t('security.cancel')}
      </Button>
    </Stack>
  );
};
