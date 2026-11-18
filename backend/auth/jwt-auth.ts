import type { CustomJwtPayload } from '../types/CustomJwtPayload.js';
import { getAdminSession } from './adminSessions.js';

export async function getUserFromToken(context: CustomJwtPayload) {
  return (await getAdminSession(context['auth']))?.user;
}
