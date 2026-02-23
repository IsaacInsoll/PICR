import type { PicrUser } from '../../types';
import type { AvatarProps } from '@mantine/core';
import { Avatar, Tooltip } from '@mantine/core';

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
