import UserModel from '../../db/UserModel';
import { hashPassword } from '../../helpers/hashPassword';
import { generateAccessToken } from '../../auth/jwt-auth';
import { GraphQLNonNull, GraphQLString } from 'graphql';

const resolver = async (_, params, context) => {
  const p = params.password;
  if (!p || p === '') return '';
  const user = await UserModel.findOne({
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
