import { getUserFromToken } from '../../auth/jwt-auth';
import { userType } from '../types/userType';
import Folder from '../../models/Folder';
import { userToJSON } from '../helpers/userToJSON';
import { DBFolderForId } from '../../db/picrDb';
import { getUserFromUUID } from '../../auth/getUserFromUUID';

const resolver = async (_, params, context) => {
  const user = await getUserFromToken(context);
  if (user) {
    const folder = await DBFolderForId(user.folderId);
    user.updateLastAccess();
    return { ...userToJSON(user), folder };
  }
  const publicUser = await getUserFromUUID(context);
  if (!publicUser) return null;
  publicUser.updateLastAccess();
  // don't expose many public user details
  return { ...userToJSON(publicUser) };
};

export const me = {
  type: userType,
  resolve: resolver,
};
