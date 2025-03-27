import jwt from 'jsonwebtoken';
import { CustomJwtPayload } from '../types/CustomJwtPayload';
import { picrConfig } from '../config/picrConfig';
import { dbUserForId, UserFields } from '../db/picrDb';

export function generateAccessToken(obj) {
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
