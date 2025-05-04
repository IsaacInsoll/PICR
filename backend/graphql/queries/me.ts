import { userType } from '../types/userType';
import { userToJSON } from '../helpers/userToJSON';
import { dbFolderForId, updateUserLastAccess } from '../../db/picrDb';
import { PicrRequestContext } from '../../types/PicrRequestContext';

const resolver = async (_, params, context: PicrRequestContext) => {
  const user = context.user;
  if (user) {
    const folder = await dbFolderForId(user.folderId);
    await updateUserLastAccess(user.id);
    return { ...userToJSON(user), folder: folder };
  }
};

export const me = {
  type: userType,
  resolve: resolver,
};
