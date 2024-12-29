import { requireFullAdmin } from './admins';
import { brandingType } from '../types/brandingType';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import Branding from '../../models/Branding';
import Folder from '../../models/Folder';
import { addFolderRelationship } from '../helpers/addFolderRelationship';

const resolver = async (_, params, context) => {
  await requireFullAdmin(context);
  const list = await Branding.findAll();
  return addFolderRelationship(list.map((b) => b.toJSON()));
};

export const brandings = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(brandingType))),
  resolve: resolver,
};
