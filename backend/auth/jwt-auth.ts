import jwt from 'jsonwebtoken';
import type { CustomJwtPayload } from '../types/CustomJwtPayload.js';
import { picrConfig } from '../config/picrConfig.js';
import type { UserFields } from '../db/picrDb.js';
import { dbUserForId } from '../db/picrDb.js';

export function generateAccessToken(obj: {
  userId: number;
  hashedPassword: string;
}) {
  const tokenSecret = picrConfig.tokenSecret;
  if (!tokenSecret)
    throw new Error('TOKEN_SECRET environment variable is required');
  const response = jwt.sign(obj, tokenSecret, {
    expiresIn: '28 days',
  }); // 24 hours
  // console.log('JWT TOKEN', obj, response);
  return response;
}

export async function getUserFromToken(
  context: CustomJwtPayload,
): Promise<UserFields | undefined> {
  const token = context?.['auth']?.split(' ')?.[1];
  if (token == null || token === '') return undefined;
  const secret = picrConfig.tokenSecret;
  if (!secret) return undefined;

  try {
    const decoded = jwt.verify(token, secret) as CustomJwtPayload;
    if (!decoded.userId) return undefined;
    const userId = parseInt(decoded.userId);
    const user = await dbUserForId(userId);
    if (
      user &&
      user.hashedPassword === decoded.hashedPassword &&
      user.enabled &&
      !user.deleted
    )
      return user;
    return undefined;
  } catch {
    return undefined; //doAuthError('Invalid Token: ' + token);
  }
}
