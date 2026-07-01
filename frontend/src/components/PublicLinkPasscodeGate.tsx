import {
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
} from '@mantine/core';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from 'urql';
import { publicLinkInfoQuery } from '@shared/urql/queries/publicLinkInfoQuery';
import { getUUID } from '../helpers/getUUID';
import { setPublicLinkPasscode } from '../helpers/publicLinkPasscode';
import { PasswordIcon } from '../PicrIcons';
import { applyBrandingDefaults, themeModeAtom } from '../atoms/themeModeAtom';
import { useSetAtom } from 'jotai';

export const usePublicLinkPasscodeGate = (): {
  pauseMe: boolean;
  element: ReactNode | null;
} => {
  const uuid = getUUID();
  const setThemeMode = useSetAtom(themeModeAtom);
  const [passcode, setPasscode] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const [result, reexecuteQuery] = useQuery({
    query: publicLinkInfoQuery,
    variables: { uuid: uuid ?? '' },
    pause: !uuid,
  });

  const info = result.data?.publicLinkInfo;
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
    if (uuid && info) setThemeMode(gateTheme);
  }, [gateTheme, info, setThemeMode, uuid]);

  const isLocked = !!info?.requiresPasscode && !info.unlocked;
  const unavailable = info?.available === false;
  const pauseMe = !!uuid && (result.fetching || isLocked || unavailable);

  if (!uuid) return { pauseMe: false, element: null };

  if (unavailable) {
    return {
      pauseMe,
      element: (
        <Center mih="100dvh" p="md">
          <Paper withBorder p="xl" radius="sm" maw={420} w="100%">
            <Stack>
              <Text component="h1" size="xl" fw={700}>
                Gallery unavailable
              </Text>
              <Text c="dimmed">
                This link does not exist or is no longer enabled.
              </Text>
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
            <Text component="h1" size="xl" fw={700}>
              {info.galleryName ?? 'Gallery passcode'}
            </Text>
            <Text c="dimmed">Enter the passcode to open this gallery.</Text>
            <PasswordInput
              autoFocus
              label="Passcode"
              leftSection={<PasswordIcon />}
              value={passcode}
              error={
                hasAttempted && !result.fetching ? 'Incorrect passcode' : null
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
              Open gallery
            </Button>
          </Stack>
        </Paper>
      </Center>
    ),
  };
};
