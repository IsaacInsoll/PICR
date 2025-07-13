import { AvatarProps, Group, Text } from '@mantine/core';
import { useQuery } from 'urql';
import { viewUserQuery } from '@shared/urql/queries/viewUserQuery';
import { PicrAvatar } from './PicrAvatar';

export const LazyPicrAvatar = ({
  userId,
  showName,
  ...props
}: {
  userId: string;
  showName?: boolean;
  props?: AvatarProps;
}) => {
  const [data] = useQuery({ query: viewUserQuery, variables: { id: userId } });
  const user = data.data?.user;
  if (showName) {
    return user ? (
      <Group>
        <PicrAvatar user={user} {...props} />
        <Text size="sm">{user.name}</Text>
      </Group>
    ) : (
      <></>
    );
  }
  return user ? <PicrAvatar user={user} {...props} /> : <></>;
};
