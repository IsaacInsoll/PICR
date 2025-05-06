import jwt from 'jsonwebtoken';
import { CustomJwtPayload } from '../types/CustomJwtPayload.js';
import { picrConfig } from '../config/picrConfig.js';
import { dbUserForId, UserFields } from '../db/picrDb.js';

export function generateAccessToken(obj: {
  userId: number;
  hashedPassword: string;
}) {
  const response = jwt.sign(obj, picrConfig.tokenSecret!, {
    expiresIn: '28 days',
  }); // 24 hours
  // console.log('JWT TOKEN', obj, response);
  return response;
}

export async function getUserFromToken(
  context: CustomJwtPayload,
): Promise<UserFields | undefined> {
  const token = context?.auth?.split(' ')?.[1];
  if (token == null || token === '') return undefined;
  const secret = picrConfig.tokenSecret as string;

  try {
    const decoded = jwt.verify(token, secret) as CustomJwtPayload;
    if (!decoded.userId) return undefined;
    const userId = parseInt(decoded.userId);
    const user = await dbUserForId(userId);
    if (user && user.hashedPassword == decoded.hashedPassword && user.enabled)
      return user;
    return undefined;
  } catch (error) {
    return undefined; //doAuthError('Invalid Token: ' + token);
  }
}
