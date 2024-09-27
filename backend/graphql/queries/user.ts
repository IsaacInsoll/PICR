import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { GraphQLError } from 'graphql/error';
import User from '../../models/User';
import { getFolder } from '../helpers/getFolder';
import { GraphQLID, GraphQLNonNull } from 'graphql/index';
import { userType } from '../types/userType';

const resolver = async (_, params, context) => {
  const user = await User.findByPk(params.id);
  if (!user) throw new GraphQLError('Could not find user ' + params.id);
  const [p, u] = await contextPermissionsForFolder(
    context,
    user.folderId,
    true,
  );
  if (p !== 'Admin') throw new GraphQLError('You must be an Admin to see this');
  return { ...user.toJSON(), folder: getFolder(user.folderId) };
};

export const user = {
  type: new GraphQLNonNull(userType),
  resolve: resolver,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
};
