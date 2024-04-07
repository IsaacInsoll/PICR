import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import Folder from '../../models/Folder';
import { hashFolderContents } from '../../helpers/zip';
import { addToZipQueue } from '../../helpers/zipQueue';

export const generateZipResolver = async (_, params, context) => {
  const [p, u] = await perms(context, params.folderId, true);
  if (p == 'None') doAuthError("You don't have permissions for this folder");
  const folder = await Folder.findByPk(params.folderId);
  const h = await hashFolderContents(folder);
  addToZipQueue(h);
  return h.hash;
};
