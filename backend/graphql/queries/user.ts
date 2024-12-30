import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLError } from 'graphql/error';
import User from '../../models/User';
import { GraphQLID, GraphQLNonNull } from 'graphql';
import { userType } from '../types/userType';
import { userToJSON } from '../helpers/userToJSON';

const resolver = async (_, params, context) => {
  const user = await User.findByPk(params.id);
  if (!user) throw new GraphQLError('Could not find user ' + params.id);
  const { folder } = await contextPermissions(context, user.folderId, 'Admin');
  return { ...userToJSON(user), folder };
};

export const user = {
  type: new GraphQLNonNull(userType),
  resolve: resolver,
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
};
