import { requireFullAdmin } from './admins';
import { brandingType } from '../types/brandingType';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { addFolderRelationship } from '../helpers/addFolderRelationship';
import { db } from '../../db/picrDb';
import { PicrRequestContext } from '../../types/PicrRequestContext';

const resolver = async (_, params, context: PicrRequestContext) => {
  await requireFullAdmin(context);
  const list = await db.query.dbBranding.findMany();
  return addFolderRelationship(list);
};

export const brandings = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(brandingType))),
  resolve: resolver,
};
