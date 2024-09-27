import User from '../../models/User';
import { hashPassword } from '../../helpers/hashPassword';
import { generateAccessToken } from '../../auth/jwt-auth';
import { GraphQLField, GraphQLNonNull, GraphQLString } from 'graphql';
import { GraphQLFieldResolver } from 'graphql/type';
import { IncomingCustomHeaders } from '../../types/incomingCustomHeaders';

const resolver = async (_, params, context) => {
  const p = params.password;
  if (!p || p === '') return '';
  const user = await User.findOne({
    where: {
      username: params.user,
      hashedPassword: hashPassword(p),
      enabled: true,
    },
  });
  if (!user) return '';
  return generateAccessToken({
    userId: user.id,
    hashedPassword: user.hashedPassword,
  });
};

export const auth = {
  type: new GraphQLNonNull(GraphQLString),
  resolve: resolver,
  args: {
    user: { type: new GraphQLNonNull(GraphQLString) },
    password: { type: new GraphQLNonNull(GraphQLString) },
  },
};
