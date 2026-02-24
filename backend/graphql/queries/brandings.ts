import { requireFullAdmin } from './admins.js';
import { brandingType } from '../types/brandingType.js';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { db } from '../../db/picrDb.js';
import type { PicrResolver } from '../helpers/picrResolver.js';

const resolver: PicrResolver = async (_, params, context) => {
  await requireFullAdmin(context);
  return db.query.dbBranding.findMany();
};

export const brandings = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(brandingType))),
  resolve: resolver,
};
