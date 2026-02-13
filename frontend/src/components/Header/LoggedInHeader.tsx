import { useMe } from '../../hooks/useMe';
import { Page } from '../Page';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Group,
  Image,
  Menu,
  Modal,
  Stack,
  Text,
} from '@mantine/core';

import classes from './LoggedInHeader.module.css';
import { PicrLogo } from '../../pages/LoginForm';
import { PicrAvatar } from '../PicrAvatar';
import { useFolderLink } from '../../hooks/useSetFolder';
import { useQuickFind } from '../QuickFind/useQuickFind';
import { Link, useLocation } from 'react-router';
import {
  DashboardIcon,
  HomeIcon,
  LogOutIcon,
  OpenInAppIcon,
  SearchIcon,
  UserSettingsIcon,
} from '../../PicrIcons';
import { atom, useSetAtom } from 'jotai';
import { authKeyAtom } from '../../atoms/authAtom';
import { MinimalFolder } from '../../../types';
import { useIsMobile } from '../../hooks/useIsMobile';
import { ManageFolderButton } from '../ManageFolderButton';
import { PicrMenuItem } from '../PicrLink';
import { UAParser } from 'ua-parser-js';
import { User } from '@shared/gql/graphql';
import { useAtom } from 'jotai/index';
import { appStoreLinks } from '@shared/consts';

export const LoggedInHeader = ({
  folder,
  managing,
}: {
  folder?: MinimalFolder;
  managing?: boolean;
}) => {
  const me = useMe();

  return (
    <header className={classes.header}>
      <Page>
        {me?.isUser ? (
          <Group>
            <LeftSide me={me} folder={folder} managing={managing} />
            <RightSide me={me} />
          </Group>
        ) : null}
        {me?.isLink ? <PublicUser me={me} folder={folder} /> : null}
      </Page>
    </header>
  );
};

const PublicUser = ({ me, folder }) => {
  console.log(folder);
  return (
    <Group>
      <Box style={{ flexGrow: 1 }}></Box>
      <Group>
        <Text size="xs" c="dimmed">
          {me.name}
        </Text>
        <PicrAvatar user={me} size="sm" />
      </Group>
    </Group>
  );
};

const LeftSide = ({
  me,
  folder,
  managing,
}: {
  me: User;
  folder?: MinimalFolder;
  managing?: boolean;
}) => {
  const isMobile = useIsMobile();
  const homeFolderLink = useFolderLink(me.folder);
  const [, setOpened] = useQuickFind();
  return (
    <Box style={{ flexGrow: 1 }}>
      <Group gap="md">
        {folder ? (
          <ManageFolderButton folder={folder} managing={managing} />
        ) : null}
        {!folder || !isMobile ? (
          <Button
            {...homeFolderLink}
            leftSection={<PicrLogo style={{ width: 16 }} />}
            variant="subtle"
            color="gray"
            size="xs"
          >
            {me.folder?.name ?? 'Home'}
          </Button>
        ) : null}
        {!isMobile ? (
          <>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() => {
                setOpened(true);
              }}
            >
              <SearchIcon />
            </ActionIcon>
          </>
        ) : null}
      </Group>
    </Box>
  );
};

const RightSide = ({ me }) => {
  const homeFolderLink = useFolderLink(me.folder);
  const [, setOpened] = useQuickFind();
  const logOut = useLogout();

  return (
    <>
      <OpenInAppModal />
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
          <Menu.Label>Files & Folders</Menu.Label>
          <PicrMenuItem leftSection={<DashboardIcon />} to="/admin">
            Dashboard
          </PicrMenuItem>
          <PicrMenuItem leftSection={<HomeIcon />} {...homeFolderLink}>
            {me.folder?.name ?? 'Home'}
          </PicrMenuItem>
          <Menu.Item
            leftSection={<SearchIcon />}
            onClick={() => setOpened(true)}
          >
            Search
          </Menu.Item>
          <Menu.Label>PICR</Menu.Label>
          <OpenInApp />
          <PicrMenuItem leftSection={<UserSettingsIcon />} to="/admin/settings">
            Settings
          </PicrMenuItem>
          <Menu.Item leftSection={<LogOutIcon />} onClick={logOut}>
            Log out
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
};

const useLogout = () => {
  const setAuthKey = useSetAtom(authKeyAtom);
  return () => {
    setAuthKey('');
    window.location.reload();
  };
};

const openInAppAtom = atom<string | undefined>(undefined);

const OpenInApp = () => {
  const { device } = UAParser(navigator.userAgent);
  const isMobile = device.is('mobile');
  const location = useLocation();
  const setOpen = useSetAtom(openInAppAtom);
  if (!isMobile) return null;

  const appUrl = 'picr://' + window.location.host + location.pathname;

  return (
    <>
      <Menu.Item
        component={Link}
        leftSection={<OpenInAppIcon />}
        to={appUrl}
        onClick={() => setOpen(appUrl)}
      >
        Open in app
      </Menu.Item>
    </>
  );
};

const OpenInAppModal = () => {
  const [open, setOpen] = useAtom(openInAppAtom);
  return (
    <Modal
      size="xs"
      opened={open}
      onClose={() => setOpen(undefined)}
      title="Download the PICR App"
      centered={true}
    >
      <Stack style={{ alignItems: 'center' }}>
        <Text size="sm" c="dimmed">
          PICR should open automatically if it is installed.
        </Text>
        <a href={appStoreLinks.ios} target="_blank">
          <Image src="/app-store.png" style={imgProps} />
        </a>
        <a href={appStoreLinks.android} target="_blank">
          <Image src="/google-play.png" style={imgProps} />
        </a>
        <Anchor href={open} size="sm" c="dimmed">
          Open App
        </Anchor>
      </Stack>
    </Modal>
  );
};

const imgProps = { width: 150 };
