import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { getFolder } from './resolverHelpers';

export const folderResolver = async (params, context) => {
  const permissions = await contextPermissionsForFolder(
    context,
    params.id,
    true,
  );
  const data = await getFolder(params.id);
  return { ...data, permissions };
};
