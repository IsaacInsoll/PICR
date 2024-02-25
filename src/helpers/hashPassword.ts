import { pbkdf2Sync } from 'node:crypto';

export const hashPassword = (password: string): string => {
  const salt = process.env.TOKEN_SECRET;
  return pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
};
