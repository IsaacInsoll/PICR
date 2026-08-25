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
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useClient, useQuery } from 'urql';
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
// Language switcher soft-disabled (#84) — restore alongside the JSX below.
// import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

export const usePublicLinkPasscodeGate = (): {
  pauseMe: boolean;
  element: ReactNode | null;
} => {
  const { t } = useTranslation('gallery');
  const uuid = getUUID();
  const client = useClient();
  const { formatDate } = useDateFormatters();
  const setThemeMode = useSetAtom(themeModeAtom);
  const accessIncident = useAtomValue(publicLinkAccessIncidentAtom);
  const [passcode, setPasscode] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const [result, reexecuteQuery] = useQuery({
    query: publicLinkInfoQuery,
    variables: { uuid: uuid ?? '' },
    pause: !uuid,
  });

  const info = result.data?.publicLinkInfo;
  const incidentExpired = !!uuid && accessIncident?.uuid === uuid;
  const status = incidentExpired
    ? PublicLinkAccessStatus.Expired
    : info?.status;
  const isLocked = status === PublicLinkAccessStatus.PasscodeRequired;
  const expired = status === PublicLinkAccessStatus.Expired;
  const unavailable = status === PublicLinkAccessStatus.Unavailable;
  const isGateVisible =
    !!uuid && !!info && (isLocked || expired || unavailable);
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
    if (!incidentExpired || !uuid) return;
    let cancelled = false;

    // Keep the incident pinned until a fresh publicLinkInfo response arrives.
    // Clearing on every successful status also handles an administrator
    // extending the link between the rejected query and this refresh.
    void client
      .query(publicLinkInfoQuery, { uuid }, { requestPolicy: 'network-only' })
      .toPromise()
      .then((refreshResult) => {
        if (!cancelled && refreshResult.data?.publicLinkInfo) {
          clearPublicLinkAccessIncident(uuid);
        }
      })
      .catch(() => {
        // A rejected refresh must not pin the incident forever: fall back to
        // whatever the gate's own query reports rather than stranding the
        // visitor on the expired screen.
        if (!cancelled) clearPublicLinkAccessIncident(uuid);
      });

    return () => {
      cancelled = true;
    };
  }, [accessIncident?.id, client, incidentExpired, uuid]);

  const pauseMe =
    !!uuid && (result.fetching || isLocked || expired || unavailable);

  if (!uuid) return { pauseMe: false, element: null };

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
