import { getUserFromToken } from '../../auth/jwt-auth';
import { getUserFromUUID } from '../../auth/contextPermissionsForFolder';
import { userType } from '../types/userType';
import Folder from '../../models/Folder';
import { userToJSON } from '../helpers/userToJSON';

const resolver = async (_, params, context) => {
  const user = await getUserFromToken(context);
  if (user) {
    const folder = await Folder.findByPk(user.folderId);
    return { ...userToJSON(user), folder: folder.toJSON() };
  }
  const publicUser = await getUserFromUUID(context);
  if (!publicUser) return null;
  // don't expose many public user details
  return { ...userToJSON(publicUser), name: null };
};

export const me = {
  type: userType,
  resolve: resolver,
};
