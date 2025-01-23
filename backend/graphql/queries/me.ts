import { getUserFromToken } from '../../auth/jwt-auth';
import { userType } from '../types/userType';
import FolderModel from '../../db/FolderModel';
import { userToJSON } from '../helpers/userToJSON';
import { getUserFromUUID } from '../../auth/getUserFromUUID';

const resolver = async (_, params, context) => {
  const user = await getUserFromToken(context);
  if (user) {
    const folder = await FolderModel.findByPk(user.folderId);
    user.updateLastAccess();
    return { ...userToJSON(user), folder: folder.toJSON() };
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
