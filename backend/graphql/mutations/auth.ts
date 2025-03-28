import { hashPassword } from '../../helpers/hashPassword';
import { generateAccessToken } from '../../auth/jwt-auth';
import { GraphQLNonNull, GraphQLString } from 'graphql';
import { db } from '../../db/picrDb';
import { and, eq } from 'drizzle-orm';
import { dbUser } from '../../db/models';

const resolver = async (_, params, context) => {
  const p = params.password;
  if (!p || p === '') return '';

  const user = await db.query.dbUser.findFirst({
    where: and(
      eq(dbUser.username, params.user),
      eq(dbUser.hashedPassword, hashPassword(p)),
      eq(dbUser.enabled, true),
    ),
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
