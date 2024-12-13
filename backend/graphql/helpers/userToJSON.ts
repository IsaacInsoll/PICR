import User from '../../models/User';
import gravatar from 'gravatar';

export const userToJSON = (u: User) => {
  const g = u.username?.includes('@')
    ? gravatar.url(u.username, { d: '404' })
    : null;
  return { ...u.toJSON(), gravatar: g };
};
