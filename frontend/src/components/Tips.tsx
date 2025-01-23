import { Alert, AlertProps } from '@mantine/core';
import { ReactNode } from 'react';
import {
  AccessLogsIcon,
  BrandingIcon,
  DashboardIcon,
  InfoIcon,
  PublicLinkIcon,
  UserSettingsIcon,
} from '../PicrIcons';

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

const Branding: TipType = {
  icon: <BrandingIcon />,
  content: (
    <>
      You can set up one or more 'brands' which contain a logo and color scheme.{' '}
      Brands apply to a certain folder and all subfolders.
      <br />
      EG: a dark brand for fitness photos and a bright brand for wedding photos.
    </>
  ),
};
const Logs: TipType = {
  icon: <AccessLogsIcon />,
  content: (
    <>
      Picr logs each time a folder is opened by a user so you can check who is
      using your links.
    </>
  ),
};

const Dashboard: TipType = {
  icon: <DashboardIcon />,
  content: (
    <>PICR enables you to share your photos/videos with your clients. </>
  ),
};

const TipList = {
  PublicLink,
  Users,
  Branding,
  Logs,
  Dashboard,
} as const;
