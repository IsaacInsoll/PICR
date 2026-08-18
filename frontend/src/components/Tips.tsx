import type { AlertProps } from '@mantine/core';
import { Alert } from '@mantine/core';
import type { ReactNode } from 'react';
import {
  AccessLogsIcon,
  BrandingIcon,
  DashboardIcon,
  InfoIcon,
  PublicLinkIcon,
  UserSettingsIcon,
} from '../PicrIcons';
import { useTranslation } from 'react-i18next';

export const Tips = ({
  type,
  ...props
}: {
  type: keyof typeof TipList;
  props?: AlertProps;
}) => {
  const { t } = useTranslation('admin');
  const { key, icon } = TipList[type];
  return (
    <Alert
      variant="light"
      title=""
      icon={icon ?? <InfoIcon />}
      my="sm"
      p="sm"
      {...props}
    >
      {t(key)}
    </Alert>
  );
};

interface TipType {
  key:
    | 'tips.publicLink'
    | 'tips.users'
    | 'tips.branding'
    | 'tips.logs'
    | 'tips.dashboard';
  icon?: ReactNode;
}

const PublicLink: TipType = {
  icon: <PublicLinkIcon />,
  key: 'tips.publicLink',
};

const Users: TipType = {
  icon: <UserSettingsIcon />,
  key: 'tips.users',
};

const Branding: TipType = {
  icon: <BrandingIcon />,
  key: 'tips.branding',
};
const Logs: TipType = {
  icon: <AccessLogsIcon />,
  key: 'tips.logs',
};

const Dashboard: TipType = {
  icon: <DashboardIcon />,
  key: 'tips.dashboard',
};

const TipList = {
  PublicLink,
  Users,
  Branding,
  Logs,
  Dashboard,
} as const;
