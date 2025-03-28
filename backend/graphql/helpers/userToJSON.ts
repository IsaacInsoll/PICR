import gravatar from 'gravatar';
import { UserFields } from '../../db/picrDb';

export const userToJSON = (u: UserFields) => {
  const g = u.username?.includes('@')
    ? gravatar.url(u.username, { d: '404' })
    : null;
  return { ...u, gravatar: g };
};
