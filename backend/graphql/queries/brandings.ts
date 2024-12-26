import { requireFullAdmin } from './admins';
import { brandingType } from '../types/brandingType';
import { GraphQLList, GraphQLNonNull } from 'graphql/index';
import Branding from '../../models/Branding';
import Folder from '../../models/Folder';
import { folder } from './folder';

const resolver = async (_, params, context, schema) => {
  await requireFullAdmin(context);
  const list = await Branding.findAll();
  const folders = await Folder.findAll({
    where: { id: list.map((b) => b.folderId) },
  });
  return list.map((b) => {
    return {
      ...b.toJSON(),
      folder: folders.find((f) => f.id == b.folderId)?.toJSON(),
    };
  });
};

export const brandings = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(brandingType))),
  resolve: resolver,
};
