import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { getFolder } from './resolverHelpers';
import { createAccessLog } from '../../models/AccessLog';
import Folder from '../../models/Folder';

export const folderResolver = async (params, context) => {
  const [permissions, u] = await perms(context, params.id, true);
  const f = await getFolder(params.id);
  const data = { ...f, permissions };

  const [parentPerms] = await perms(context, f.parentId);
  if (parentPerms !== 'None') {
    const p = await Folder.findByPk(f.parentId);
    if (p) {
      data.parent = p.toJSON();
    }
  }
  createAccessLog(u.id, f.id);
  return data;
};
