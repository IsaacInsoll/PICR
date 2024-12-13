import { MinimalSharedFolder } from '../../types';
import { Avatar, AvatarProps, Tooltip } from '@mantine/core';

export const PicrAvatar = ({
  user,
  ...props
}: {
  user: MinimalSharedFolder;
  props?: AvatarProps;
}) => {
  return (
    <Tooltip.Floating label={user.name}>
      <Avatar
        name={user.name}
        src={user.gravatar}
        color="initials"
        {...props}
      />
    </Tooltip.Floating>
  );
};
