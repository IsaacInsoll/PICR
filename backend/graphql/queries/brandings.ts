import { requireFullAdmin } from './admins.js';
import { brandingType } from '../types/brandingType.js';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { db } from '../../db/picrDb.js';
import { PicrRequestContext } from '../../types/PicrRequestContext.js';
import { GraphQLFieldResolver } from 'graphql/type/index.js';

const resolver: GraphQLFieldResolver<unknown, PicrRequestContext> = async (
  _,
  params,
  context,
) => {
  await requireFullAdmin(context);
  return db.query.dbBranding.findMany();
};

export const brandings = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(brandingType))),
  resolve: resolver,
};
