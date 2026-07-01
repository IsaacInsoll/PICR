import {
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
} from '@mantine/core';
import { useState, type ReactNode } from 'react';
import { useQuery } from 'urql';
import { publicLinkInfoQuery } from '@shared/urql/queries/publicLinkInfoQuery';
import { getUUID } from '../helpers/getUUID';
import { setPublicLinkPasscode } from '../helpers/publicLinkPasscode';
import { PasswordIcon, PublicLinkIcon } from '../PicrIcons';

export const usePublicLinkPasscodeGate = (): {
  pauseMe: boolean;
  element: ReactNode | null;
} => {
  const uuid = getUUID();
  const [passcode, setPasscode] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);
  const [result, reexecuteQuery] = useQuery({
    query: publicLinkInfoQuery,
    variables: { uuid: uuid ?? '' },
    pause: !uuid,
  });

  const info = result.data?.publicLinkInfo;
  const isLocked = !!info?.requiresPasscode && !info.unlocked;
  const pauseMe = !!uuid && (result.fetching || isLocked);

  if (!uuid) return { pauseMe: false, element: null };

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
              Gallery passcode
            </Text>
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
