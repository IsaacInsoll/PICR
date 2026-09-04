import { Avatar } from '@kolking/react-native-avatar';
import type { AvatarProps } from '@kolking/react-native-avatar';
import type { User } from '@shared/gql/graphql';
import { getInitialsColor } from '@/src/helpers/get-initials-color';

export const AppAvatar = ({
  user,
  ...props
}: { user: Pick<User, 'name' | 'gravatar'> } & AvatarProps) => {
  const name = user.name ?? 'Picr User'; // this should never happen :P
  const color = getInitialsColor(name);
  return (
    <Avatar
      name={name}
      color={color}
      source={user.gravatar ? { uri: user.gravatar } : undefined}
      {...props}
    />
  );
};
