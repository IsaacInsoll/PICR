import UserModel from '../../db/UserModel';
import gravatar from 'gravatar';

export const userToJSON = (u: UserModel) => {
  const g = u.username?.includes('@')
    ? gravatar.url(u.username, { d: '404' })
    : null;
  return { ...u.toJSON(), gravatar: g };
};
