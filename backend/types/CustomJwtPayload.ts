import type { JwtPayload } from 'jsonwebtoken';

export type CustomJwtPayload = JwtPayload & {
  userId?: string;
  uuid?: string;
  hashedPassword?: string;
};
