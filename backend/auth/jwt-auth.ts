import jwt from 'jsonwebtoken';
import { CustomJwtPayload } from '../types/CustomJwtPayload';
import UserModel from '../db/UserModel';
import { picrConfig } from '../config/picrConfig';

export function generateAccessToken(obj) {
  const response = jwt.sign(obj, picrConfig.tokenSecret, {
    expiresIn: '28 days',
  }); // 24 hours
  // console.log('JWT TOKEN', obj, response);
  return response;
}

export async function getUserFromToken(
  context: CustomJwtPayload,
): Promise<UserModel | undefined> {
  const token = context?.auth?.split(' ')?.[1];
  if (token == null || token === '') return undefined;
  const secret = picrConfig.tokenSecret as string;

  try {
    const decoded = jwt.verify(token, secret) as CustomJwtPayload;
    const user = await UserModel.findByPk(decoded.userId);
    if (user.hashedPassword == decoded.hashedPassword && user.enabled)
      return user;
    return undefined;
  } catch (error) {
    return undefined; //doAuthError('Invalid Token: ' + token);
  }
}
