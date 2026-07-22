import { createHash } from 'node:crypto';
import type { UserFields } from '../../db/picrDb.js';

const gravatarUrlForEmail = (email: string) => {
  const hash = createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=404`;
};

export const userToJSON = (u: UserFields) => {
  const g = u.username?.includes('@') ? gravatarUrlForEmail(u.username) : null;
  return { ...u, gravatar: g };
};
