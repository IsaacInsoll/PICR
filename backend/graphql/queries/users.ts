import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { GraphQLError } from 'graphql/error';
import Folder from '../../models/Folder';
import { folderAndAllParentIds } from '../../helpers/folderAndAllParentIds';
import User from '../../models/User';
import { Op } from 'sequelize';
import { getFolder } from '../helpers/getFolder';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { userType } from '../types/userType';

const resolver = async (_, params, context) => {
  const [p, u] = await contextPermissionsForFolder(
    context,
    params.folderId,
    true,
  );
  if (p !== 'Admin') throw new GraphQLError('You must be an Admin to see this');

  const folder = await Folder.findByPk(params.folderId);

  const ids = params.includeParents
    ? [await folderAndAllParentIds(folder)]
    : folder.id;
  // we don't show 'real users' just 'shared public users'
  const data = await User.findAll({
    where: { folderId: { [Op.or]: ids }, uuid: { [Op.not]: null } },
  });
  return data.map((pl) => {
    return { ...pl.toJSON(), folder: getFolder(pl.folderId) };
  });
};

export const users = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    includeParents: { type: GraphQLBoolean },
  },
};
