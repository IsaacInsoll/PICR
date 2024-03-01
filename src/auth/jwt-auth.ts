import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { CustomJwtPayload } from '../types/CustomJwtPayload';
import User from '../models/User';

config(); // get config vars
export function generateAccessToken(obj) {
  const response = jwt.sign(obj, process.env.TOKEN_SECRET, {
    expiresIn: '86400s',
  }); // 24 hours
  console.log('JWT TOKEN', obj, response);
  return response;
}

export async function getUserFromToken(context) {
  const token = context.auth.split(' ')[1];
  if (token == null || token === '') return undefined;
  const secret = process.env.TOKEN_SECRET as string;

  try {
    const decoded = jwt.verify(token, secret) as CustomJwtPayload;
    return await User.findByPk(decoded.userId);
  } catch (error) {
    return undefined; //doAuthError('Invalid Token: ' + token);
  }
}
