import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { getFolder } from './resolverHelpers';
import { createAccessLog } from '../../models/AccessLog';
import { ParentFolders } from '../../auth/folderUtils';
import { Folder } from '../../../graphql-types';

export const folderResolver = async (_, params, context): Promise<Folder> => {
  const [permissions, u] = await perms(context, params.id, true);
  const f = await getFolder(params.id);
  const data = { ...f, permissions };
  data.parents = ParentFolders(f, context);
  createAccessLog(u.id, f.id);
  return data;
};
