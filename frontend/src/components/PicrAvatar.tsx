import { MinimalSharedFolder } from '../../types';
import { Avatar, AvatarProps } from '@mantine/core';

export const PicrAvatar = ({
  user,
  ...props
}: {
  user: MinimalSharedFolder;
  props?: AvatarProps;
}) => {
  return <Avatar name={user.name} color="initials" {...props} />;
};
