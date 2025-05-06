import { pbkdf2Sync } from 'node:crypto';
import { picrConfig } from "../config/picrConfig.js";

export const hashPassword = (password: string): string => {
  const salt = picrConfig.tokenSecret!;
  return pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
};
