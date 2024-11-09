import { useMe } from '../../hooks/useMe';
import { Page } from '../Page';
import { ActionIcon, Box, Button, Group, Menu, Text } from '@mantine/core';

import classes from './LoggedInHeader.module.css';
import { PicrLogo } from '../../pages/LoginForm';
import { PicrAvatar } from '../PicrAvatar';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useQuickFind } from '../QuickFind/useQuickFind';
import { useNavigate } from 'react-router-dom';
import { LogOutIcon, SearchIcon, UserSettingsIcon } from '../../PicrIcons';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom } from '../../atoms/authAtom';

export const LoggedInHeader = () => {
  const me = useMe();
  return (
    <header className={classes.header}>
      <Page>
        <Group>
          <LeftSide me={me} />
          <RightSide me={me} />
        </Group>
      </Page>
    </header>
  );
};

const LeftSide = ({ me }) => {
  const setFolder = useSetFolder();
  const [, setOpened] = useQuickFind();
  const navigate = useNavigate();
  return (
    <Box style={{ flexGrow: 1 }}>
      <Group gap="md">
        <Button
          onClick={() => {
            setFolder(me.folder);
          }}
          leftSection={<PicrLogo style={{ maxWidth: 16 }} />}
          variant="subtle"
          color="gray"
          size="xs"
        >
          {me.folder?.name ?? 'Home'}
        </Button>

        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => {
            setOpened(true);
          }}
        >
          <SearchIcon />
        </ActionIcon>
      </Group>
    </Box>
  );
};

const RightSide = ({ me }) => {
  const navigate = useNavigate();
  const logOut = useLogout();
  return (
    <Menu
      shadow="md"
      width={200}
      openDelay={0}
      trigger="hover"
      position="bottom-end"
    >
      <Menu.Target>
        <Button variant="subtle" px="xs" size="sm">
          <Group justify="right" gap="sm">
            <Text c="dimmed" size="xs">
              {me.name}
            </Text>
            <PicrAvatar user={me} size="sm" />
          </Group>
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>PICR</Menu.Label>
        <Menu.Item
          leftSection={<UserSettingsIcon />}
          onClick={() => navigate('/admin/settings')}
        >
          Settings
        </Menu.Item>
        <Menu.Item leftSection={<LogOutIcon />} onClick={logOut}>
          Log out
        </Menu.Item>{' '}
      </Menu.Dropdown>
    </Menu>
  );
};

const useLogout = () => {
  const setAuthKey = useSetAtom(authKeyAtom);
  return () => {
    console.log('logging out');
    setAuthKey('');
    window.location.reload();
  };
};
