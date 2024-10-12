import { getUserFromToken } from '../../auth/jwt-auth';
import { getUserFromUUID } from '../../auth/contextPermissionsForFolder';
import { userType } from '../types/userType';

const resolver = async (_, params, context) => {
  const user = await getUserFromToken(context);
  if (user) return user;
  const publicUser = await getUserFromUUID(context);
  if (!publicUser) return null;
  console.log(publicUser);
  // don't expose many public user details
  return { ...publicUser.toJSON(), name: null };
};

export const me = {
  type: userType,
  resolve: resolver,
};
