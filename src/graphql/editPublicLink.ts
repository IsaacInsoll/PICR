import { contextPermissionsForFolder as perms } from '../auth/contextPermissionsForFolder';
import { doAuthError } from '../auth/doAuthError';
import PublicLink from '../models/PublicLink';
import { getFolder } from './resolvers/resolverHelpers';
import {GraphQLError} from "graphql/error";

export const editPublicLink = async (params, context) => {
  const p = await perms(context, params.folderId, true);
  if (p !== 'Admin') doAuthError("You don't have permissions for this folder");
  console.log(params);
  var pl:PublicLink|null = null;
  if(params.id) {
    pl = await PublicLink.findByPk(params.id);
    if(!pl) throw new GraphQLError('No public link found for ID: ' + params.id);

  } else {
    pl = new PublicLink();
  }
  pl.folderId = params.folderId;
  pl.name = params.name;
  pl.uuid = params.uuid;
  pl.enabled = params.enabled;
  await pl.save();
  return { ...pl.toJSON(), folder: getFolder(pl.folderId) };
};
