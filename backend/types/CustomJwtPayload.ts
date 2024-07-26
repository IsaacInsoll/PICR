import { JwtPayload } from 'jsonwebtoken';

export type CustomJwtPayload = JwtPayload & { userId?: string; uuid?: string };
