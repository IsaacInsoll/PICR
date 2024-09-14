import { randomBytes } from 'node:crypto';
import { picrConfig } from '../server';

export const envSecret = async () => {
  if (!picrConfig.tokenSecret) {
    const secret = randomBytes(64).toString('hex');
    console.log(`ERROR: You haven't specified a TOKEN_SECRET in .ENV
Heres one we just created for you:
TOKEN_SECRET=${secret}`);
    process.exit();
  }
};