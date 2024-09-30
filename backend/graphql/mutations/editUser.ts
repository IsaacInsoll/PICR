import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import { GraphQLError } from 'graphql/error';
import { getFolder } from '../helpers/getFolder';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql/index';
import { userType } from '../types/userType';
import User from '../../models/User';

const resolver = async (_, params, context) => {
  const [p, u] = await perms(context, params.folderId, true);
  if (p !== 'Admin') doAuthError("You don't have permissions for this folder");
  let user: User | null = null;
  if (params.id) {
    user = await User.findByPk(params.id);
    if (!user) throw new GraphQLError('No user found for ID: ' + params.id);
  } else {
    user = new User();
  }
  user.folderId = params.folderId;
  user.name = params.name;
  user.uuid = params.uuid;
  user.enabled = params.enabled;

  await user.save();

  return { ...user.toJSON(), folder: getFolder(user.folderId) };
};

export const editUser = {
  type: new GraphQLNonNull(userType),
  resolve: resolver,
  args: {
    id: { type: GraphQLID },
    folderId: { type: GraphQLID },
    name: { type: GraphQLString },
    uuid: { type: GraphQLString },
    enabled: { type: GraphQLBoolean },
  },
};
