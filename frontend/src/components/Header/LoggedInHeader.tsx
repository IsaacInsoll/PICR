import { useMe } from '../../hooks/useMe';
import { Page } from '../Page';
import { Box, Button, ButtonProps, Group, Text } from '@mantine/core';

import classes from './LoggedInHeader.module.css';
import { PicrLogo } from '../../pages/LoginForm';
import { PicrAvatar } from '../PicrAvatar';
import { useSetFolder } from '../../hooks/useSetFolder';
import { useQuickFind } from '../QuickFind';
import { useNavigate } from 'react-router-dom';

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
      <Group gap="xs">
        <PicrLogo style={{ maxWidth: 16 }} />
        <Text size="xs" c="dimmed">
          <HeaderButton onClick={() => setFolder(me.folder)}>Home</HeaderButton>
          <HeaderButton
            onClick={() => {
              setOpened(true);
            }}
          >
            Search
          </HeaderButton>
          <HeaderButton onClick={() => navigate('/admin/settings')}>
            Settings
          </HeaderButton>
        </Text>
      </Group>
    </Box>
  );
};

const RightSide = ({ me }) => {
  return (
    <Box style={{ flexGrow: 1 }}>
      {me.isUser ? (
        <Group justify="right" gap="sm">
          <Text c="dimmed" size="xs">
            {me.name}
          </Text>
          <PicrAvatar user={me} size="sm" />
        </Group>
      ) : (
        <></>
      )}
    </Box>
  );
};

const HeaderButton = (props: ButtonProps) => {
  return (
    <Button variant="subtle" color="gray" size="xs" {...props}>
      {props.children}
    </Button>
  );
};
