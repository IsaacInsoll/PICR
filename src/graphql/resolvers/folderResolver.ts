import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { getFolder } from './resolverHelpers';

export const folderResolver = async (params, context) => {
  const permissions = await perms(context, params.id, true);
  const data = await getFolder(params.id);
  return { ...data, permissions };
};
