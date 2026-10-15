import {
  Button,
  Center,
  // Group, // Language switcher soft-disabled (#84) — restore with the JSX below.
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
} from '@mantine/core';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery } from 'urql';
import { publicLinkInfoQuery } from '@shared/urql/queries/publicLinkInfoQuery';
import { getUUID } from '../helpers/getUUID';
import { setPublicLinkPasscode } from '../helpers/publicLinkPasscode';
import { PasswordIcon } from '../PicrIcons';
import { applyBrandingDefaults, themeModeAtom } from '../atoms/themeModeAtom';
import { useAtomValue, useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { PublicLinkAccessStatus } from '@shared/gql/graphql';
import {
  clearPublicLinkAccessIncident,
  publicLinkAccessIncidentAtom,
} from '../atoms/publicLinkAccessAtom';
import { useDateFormatters } from '../i18n/useDateFormatters';
import { ComingSoonPage } from './ComingSoonPage';
// Language switcher soft-disabled (#84) — restore alongside the JSX below.
// import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

export const usePublicLinkPasscodeGate = (): {
  pauseMe: boolean;
  element: ReactNode | null;
} => {
  const { t } = useTranslation('gallery');
  const uuid = getUUID();
  const { formatDate } = useDateFormatters();
  const setThemeMode = useSetAtom(themeModeAtom);
  const accessIncident = useAtomValue(publicLinkAccessIncidentAtom);
  const [passcode, setPasscode] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const incidentRefreshStarted = useRef<number | null>(null);
  const queryContext = useMemo(() => ({ suspense: false }), []);
  const [result, reexecuteQuery] = useQuery({
    query: publicLinkInfoQuery,
    variables: { uuid: uuid ?? '' },
    pause: !uuid,
    context: queryContext,
  });

  const info = result.data?.publicLinkInfo;
  const incidentExpired = !!uuid && accessIncident?.uuid === uuid;
  const status = incidentExpired
    ? PublicLinkAccessStatus.Expired
    : info?.status;
  const isLocked = status === PublicLinkAccessStatus.PasscodeRequired;
  const expired = status === PublicLinkAccessStatus.Expired;
  const unavailable = status === PublicLinkAccessStatus.Unavailable;
  const comingSoon = status === PublicLinkAccessStatus.ComingSoon;
  const isGateVisible =
    !!uuid && !!info && (isLocked || expired || unavailable || comingSoon);
  const gateTheme = useMemo(
    () =>
      applyBrandingDefaults(
        info?.branding
          ? {
              mode: info.branding.mode,
              primaryColor: info.branding.primaryColor,
              headingFontKey: info.branding.headingFontKey,
              headingFontSize: info.branding.headingFontSize,
              headingAlignment: info.branding.headingAlignment,
            }
          : null,
      ),
    [info],
  );

  useEffect(() => {
    // This preview belongs only to the passcode/unavailable screen. Once the
    // gallery is available, ViewFolder owns the complete branding theme; a
    // parent effect here would run after ViewFolder's effect and replace its
    // gallery fields with defaults from this deliberately limited preview.
    if (isGateVisible) setThemeMode(gateTheme);
  }, [gateTheme, isGateVisible, setThemeMode]);

  useEffect(() => {
    if (!incidentExpired) return;
    reexecuteQuery({ requestPolicy: 'network-only' });
  }, [accessIncident?.id, incidentExpired, reexecuteQuery]);

  useEffect(() => {
    if (!incidentExpired) {
      incidentRefreshStarted.current = null;
      return;
    }
    if (result.fetching) {
      incidentRefreshStarted.current = accessIncident.id;
      return;
    }
    if (incidentRefreshStarted.current === accessIncident.id) {
      // The incident remains visible until a fresh query completes. An error
      // falls back to the gate's own result rather than pinning it forever.
      clearPublicLinkAccessIncident(uuid);
    }
  }, [accessIncident, incidentExpired, result.fetching, uuid]);

  useEffect(() => {
    if (!comingSoon) return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        reexecuteQuery({ requestPolicy: 'network-only' });
      }
    }, 20_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        reexecuteQuery({ requestPolicy: 'network-only' });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [comingSoon, reexecuteQuery]);

  const pauseMe =
    !!uuid &&
    (result.fetching || isLocked || expired || unavailable || comingSoon);

  if (!uuid) return { pauseMe: false, element: null };

  if (!info && result.fetching) {
    return {
      pauseMe,
      element: (
        <Center mih="100dvh">
          <Loader />
        </Center>
      ),
    };
  }

  if (incidentExpired && !info) {
    return {
      pauseMe,
      element: (
        <Center mih="100dvh">
          <Loader />
        </Center>
      ),
    };
  }

  if (expired) {
    const expiration = info?.expiresAt
      ? formatDate(info.expiresAt, { dateStyle: 'long', timeStyle: 'short' })
      : null;
    return {
      pauseMe,
      element: (
        <Center mih="100dvh" p="md">
          <Paper withBorder p="xl" radius="sm" maw={420} w="100%">
            <Stack>
              <Text component="h1" size="xl" fw={700}>
                {t('expired.title')}
              </Text>
              <Text c="dimmed">
                {expiration
                  ? t('expired.description', { date: expiration })
                  : t('expired.descriptionWithoutDate')}
              </Text>
            </Stack>
          </Paper>
        </Center>
      ),
    };
  }

  if (unavailable) {
    return {
      pauseMe,
      element: (
        <Center mih="100dvh" p="md">
          <Paper withBorder p="xl" radius="sm" maw={420} w="100%">
            <Stack>
              {/* Language switcher soft-disabled (#84). */}
              {/* <Group justify="flex-end">
                <LanguageSwitcher />
              </Group> */}
              <Text component="h1" size="xl" fw={700}>
                {t('unavailable.title')}
              </Text>
              <Text c="dimmed">{t('unavailable.description')}</Text>
            </Stack>
          </Paper>
        </Center>
      ),
    };
  }

  if (comingSoon) {
    return {
      pauseMe,
      element: (
        <ComingSoonPage
          galleryName={info?.galleryName ?? undefined}
          estimatedDeliveryAt={info?.estimatedDeliveryAt ?? undefined}
          message={info?.comingSoonMessage ?? undefined}
          onCheck={() => reexecuteQuery({ requestPolicy: 'network-only' })}
          checking={result.fetching}
        />
      ),
    };
  }

  if (!isLocked) return { pauseMe, element: null };

  const submit = () => {
    setHasAttempted(true);
    setPublicLinkPasscode(uuid, passcode);
    reexecuteQuery({ requestPolicy: 'network-only' });
  };

  return {
    pauseMe,
    element: (
      <Center mih="100dvh" p="md">
        <Paper withBorder p="xl" radius="sm" maw={420} w="100%">
          <Stack>
            {/* Language switcher soft-disabled (#84). */}
            {/* <Group justify="flex-end">
              <LanguageSwitcher />
            </Group> */}
            <Text component="h1" size="xl" fw={700}>
              {info?.galleryName ?? t('passcode.defaultTitle')}
            </Text>
            <Text c="dimmed">{t('passcode.description')}</Text>
            <PasswordInput
              autoFocus
              label={t('passcode.fieldLabel')}
              leftSection={<PasswordIcon />}
              value={passcode}
              error={
                hasAttempted && !result.fetching
                  ? t('passcode.incorrect')
                  : null
              }
              onChange={(event) => {
                setPasscode(event.currentTarget.value);
                setHasAttempted(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit();
              }}
            />
            <Button onClick={submit} loading={result.fetching}>
              {t('passcode.submit')}
            </Button>
          </Stack>
        </Paper>
      </Center>
    ),
  };
};
