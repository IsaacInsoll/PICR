import { userType } from "../types/userType.js";
import { userToJSON } from "../helpers/userToJSON.js";
import { dbFolderForId, updateUserLastAccess } from "../../db/picrDb.js";
import { PicrRequestContext } from "../../types/PicrRequestContext.js";

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
