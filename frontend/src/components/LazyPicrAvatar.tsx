import { AvatarProps } from '@mantine/core';
import { useQuery } from 'urql';
import { viewUserQuery } from '../urql/queries/viewUserQuery';
import { PicrAvatar } from './PicrAvatar';

export const LazyPicrAvatar = ({
  userId,
  ...props
}: {
  userId: string;
  props?: AvatarProps;
}) => {
  const [data] = useQuery({ query: viewUserQuery, variables: { id: userId } });
  const user = data.data?.user;
  return user ? <PicrAvatar user={user} {...props} /> : <>nfi</>;
};
