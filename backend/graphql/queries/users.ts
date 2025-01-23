import { contextPermissions } from '../../auth/contextPermissions';
import { folderAndAllParentIds } from '../../helpers/folderAndAllParentIds';
import UserModel from '../../db/UserModel';
import { Op } from 'sequelize';
import { getFolder } from '../helpers/getFolder';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { userType } from '../types/userType';
import { allSubfolders } from '../../helpers/allSubfolders';
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
    const children = await allSubfolders(folder.id);
    const childIds = children.map(({ id }) => id);
    ids.push(...childIds);
  }

  // we don't show 'real users' just 'shared public users'
  const where = { folderId: { [Op.or]: ids }, uuid: { [Op.not]: null } };
  if (params.sortByRecent) {
    where['lastAccess'] = { [Op.not]: null };
  }
  const data = await UserModel.findAll({
    where,
    order: params.sortByRecent ? [['lastAccess', 'DESC']] : undefined,
    limit: params.sortByRecent ? 10 : 1000,
  });
  return data.map((pl) => {
    console.log(pl.name);
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
    sortByRecent: { type: GraphQLBoolean },
  },
};
