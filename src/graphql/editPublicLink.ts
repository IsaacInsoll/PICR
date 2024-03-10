import { contextPermissionsForFolder as perms } from '../auth/contextPermissionsForFolder';
import { doAuthError } from '../auth/doAuthError';
import PublicLink from '../models/PublicLink';
import { getFolder } from './resolvers/resolverHelpers';

export const editPublicLink = async (params, context) => {
  const p = await perms(context, params.folderId, true);
  if (p !== 'Admin') doAuthError("You don't have permissions for this folder");
  //TODO: find existing public link with ID, and update it
  console.log(params);
  const pl = new PublicLink();
  pl.folderId = params.folderId;
  pl.name = params.name;
  pl.uuid = params.uuid;
  pl.enabled = params.enabled;
  await pl.save();
  return { ...pl.toJSON(), folder: getFolder(pl.folderId) };
};
