import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config(); // get config vars
export function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '86400s' }); // 24 hours
}
