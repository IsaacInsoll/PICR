import { getUserFromToken } from '../../auth/jwt-auth';
import { getUserFromUUID } from '../../auth/contextPermissionsForFolder';
import { userType } from '../types/userType';
import Folder from '../../models/Folder';
import { userToJSON } from '../helpers/userToJSON';
import { DBFolderForId } from '../../db/picrDb';

const resolver = async (_, params, context) => {
  const user = await getUserFromToken(context);
  if (user) {
    const folder = await DBFolderForId(user.folderId);
    return { ...userToJSON(user), folder };
  }
  const publicUser = await getUserFromUUID(context);
  if (!publicUser) return null;
  console.log(publicUser);
  // don't expose many public user details
  return { ...userToJSON(publicUser), name: null };
};

export const me = {
  type: userType,
  resolve: resolver,
};
