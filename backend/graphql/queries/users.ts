import { contextPermissions } from '../../auth/contextPermissions';
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
import { allSubFoldersRecursive } from '../helpers/allSubFoldersRecursive';
import { userToJSON } from '../helpers/userToJSON';

const resolver = async (_, params, context) => {
  const { folder, user } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );

  const ids = [folder.id];
  if (params.includeParents) {
    const parents = await folderAndAllParentIds(folder, user.folderId);
    ids.push(...parents);
  }
  if (params.includeChildren) {
    const children = await allSubFoldersRecursive(folder.id);
    const childIds = children.map(({ id }) => id);
    ids.push(...childIds);
  }

  // we don't show 'real users' just 'shared public users'
  const data = await User.findAll({
    where: { folderId: { [Op.or]: ids }, uuid: { [Op.not]: null } },
  });
  return data.map((pl) => {
    return { ...userToJSON(pl), folder: getFolder(pl.folderId) };
  });
};

export const users = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    includeParents: { type: GraphQLBoolean },
    includeChildren: { type: GraphQLBoolean },
  },
};
