import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { CustomJwtPayload } from '../types/CustomJwtPayload';
import User from '../models/User';
import { picrConfig } from '../server';

export function generateAccessToken(obj) {
  const response = jwt.sign(obj, picrConfig.tokenSecret, {
    expiresIn: '86400s',
  }); // 24 hours
  console.log('JWT TOKEN', obj, response);
  return response;
}

export async function getUserFromToken(context) {
  const token = context.auth.split(' ')[1];
  if (token == null || token === '') return undefined;
  const secret = picrConfig.tokenSecret as string;

  try {
    const decoded = jwt.verify(token, secret) as CustomJwtPayload;
    return await User.findByPk(decoded.userId);
  } catch (error) {
    return undefined; //doAuthError('Invalid Token: ' + token);
  }
}
