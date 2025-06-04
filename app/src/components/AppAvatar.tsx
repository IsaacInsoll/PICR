import { Avatar } from '@kolking/react-native-avatar';
import { User } from '@frontend/gql/graphql';
import { Props } from '@kolking/react-native-avatar/src/Avatar';
import { getInitialsColor } from '@/src/helpers/get-initials-color';

export const AppAvatar = ({
  user,
  ...props
}: { user: Pick<User, 'name' | 'gravatar'> } & Props) => {
  const name = user?.name ?? 'Picr User'; // this should never happen :P
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
