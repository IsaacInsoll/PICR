import { Alert, AlertProps } from '@mantine/core';
import { ReactNode } from 'react';
import { InfoIcon, PublicLinkIcon, UserSettingsIcon } from '../PicrIcons';

export const Tips = ({
  type,
  ...props
}: {
  type: keyof typeof TipList;
  props?: AlertProps;
}) => {
  const { content, icon } = TipList[type];
  return (
    <Alert
      variant="light"
      color="blue"
      title=""
      icon={icon ?? <InfoIcon />}
      m="sm"
      p="sm"
      {...props}
    >
      {content}
    </Alert>
  );
};

interface TipType {
  content: ReactNode;
  icon?: ReactNode;
}

const PublicLink: TipType = {
  icon: <PublicLinkIcon />,
  content: (
    <>
      Public Links allow your clients to access a folder with a{' '}
      <em>'secret link'</em>. No login required!
    </>
  ),
};

const Users: TipType = {
  icon: <UserSettingsIcon />,
  content: (
    <>
      Users have a username/password. Users who manage folders can manage
      users/links in their subfolders
    </>
  ),
};

const TipList = {
  PublicLink,
  Users,
} as const;
