import { useMe } from '../../hooks/useMe';
import { Page } from '../Page';
import { ActionIcon, Box, Button, Group, Menu, Text } from '@mantine/core';

import classes from './LoggedInHeader.module.css';
import { PicrLogo } from '../../pages/LoginForm';
import { PicrAvatar } from '../PicrAvatar';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useQuickFind } from '../QuickFind/useQuickFind';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOutIcon, SearchIcon, UserSettingsIcon } from '../../PicrIcons';
import { useSetAtom } from 'jotai/index';
import { authKeyAtom } from '../../atoms/authAtom';
import { TbFolder, TbFolderStar, TbFolderUp, TbHome } from 'react-icons/tb';
import { MinimalFolder } from '../../../types';
import { useBaseViewFolderURL } from '../../hooks/useBaseViewFolderURL';
import { useQuery } from 'urql';
import { viewFolderQuery } from '../../urql/queries/viewFolderQuery';
import { useRequery } from '../../hooks/useRequery';
import { useCallback } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

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
        <Group>
          <LeftSide me={me} folder={folder} managing={managing} />
          <RightSide me={me} />
        </Group>
      </Page>
    </header>
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
  const setFolder = useSetFolder();
  const [, setOpened] = useQuickFind();
  return (
    <Box style={{ flexGrow: 1 }}>
      <Group gap="md">
        {folder ? (
          <ManageFolderButton folder={folder} managing={managing} />
        ) : null}
        {!isMobile ? (
          <>
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
            </Button>{' '}
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

const ManageFolderButton = ({
  folder,
  managing,
}: {
  folder: MinimalFolder;
  managing: boollean;
}) => {
  const navigate = useNavigate();
  const baseUrl = useBaseViewFolderURL();
  // const setFolder = useSetFolder();

  const toggleManaging = useCallback(() => {
    navigate(baseUrl + folder.id + (managing ? '' : '/manage'));
  }, [navigate, baseUrl, folder.id, managing]);

  const icon = managing ? <TbFolder /> : <TbFolderStar />;

  return (
    <Button
      variant="outline"
      onClick={toggleManaging}
      leftSection={icon}
      size="xs"
    >
      {managing ? 'View' : 'Manage'} folder
    </Button>
  );
};

const RightSide = ({ me }) => {
  const navigate = useNavigate();
  const setFolder = useSetFolder();
  const [, setOpened] = useQuickFind();

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
        <Menu.Label>Files & Folders</Menu.Label>
        <Menu.Item
          leftSection={<TbHome />}
          onClick={() => setFolder(me.folder)}
        >
          {me.folder?.name ?? 'Home'}
        </Menu.Item>
        <Menu.Item leftSection={<SearchIcon />} onClick={() => setOpened(true)}>
          Search
        </Menu.Item>
        <Menu.Label>PICR</Menu.Label>
        <Menu.Item
          leftSection={<UserSettingsIcon />}
          onClick={() => navigate('/admin/settings')}
        >
          Settings
        </Menu.Item>
        <Menu.Item leftSection={<LogOutIcon />} onClick={logOut}>
          Log out
        </Menu.Item>
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
