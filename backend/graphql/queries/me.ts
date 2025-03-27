import { getUserFromToken } from '../../auth/jwt-auth';
import { userType } from '../types/userType';
import { userToJSON } from '../helpers/userToJSON';
import { getUserFromUUID } from '../../auth/getUserFromUUID';
import { dbFolderForId, updateUserLastAccess } from '../../db/picrDb';

const resolver = async (_, params, context) => {
  const user = await getUserFromToken(context);
  if (user) {
    const folder = await dbFolderForId(user.folderId);
    await updateUserLastAccess(user.id);
    return { ...userToJSON(user), folder: folder };
  }
  const publicUser = await getUserFromUUID(context);
  if (!publicUser) return null;
  await updateUserLastAccess(publicUser.id);
  // don't expose many public user details
  return { ...userToJSON(publicUser) };
};

export const me = {
  type: userType,
  resolve: resolver,
};
