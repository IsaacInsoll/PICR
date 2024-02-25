import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { GraphQLError } from 'graphql/error';

config(); // get config vars
export function generateAccessToken(obj) {
  const response = jwt.sign(obj, process.env.TOKEN_SECRET, {
    expiresIn: '86400s',
  }); // 24 hours
  console.log('JWT TOKEN', obj, response);
  return response;
}

export function authenticateToken(token: string) {
  if (token == null || token === '') doAuthError('No Token');
  const secret = process.env.TOKEN_SECRET as string;

  try {
    const decoded = jwt.verify(token, secret);
    return decoded.userId;
  } catch (error) {
    doAuthError('Invalid Token');
  }
}

export const doAuthError = (str: string | undefined) => {
  throw new GraphQLError('AUTH' + (str ? `: ${str}` : ''));
};
