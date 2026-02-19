import { PicrUser } from '../../types';
import { Avatar, AvatarProps, Tooltip } from '@mantine/core';

export const PicrAvatar = ({
  user,
  ...props
}: {
  user: PicrUser;
} & AvatarProps) => {
  return (
    <Tooltip.Floating label={user.name}>
      <Avatar
        name={user.name ?? undefined}
        src={user.gravatar ?? undefined}
        color="initials"
        {...props}
      />
    </Tooltip.Floating>
  );
};
