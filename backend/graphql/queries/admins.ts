import { contextPermissions } from '../../auth/contextPermissions';
import UserModel from '../../db/UserModel';
import { Op } from 'sequelize';
import { getFolder } from '../helpers/getFolder';
import { GraphQLList, GraphQLNonNull } from 'graphql';
import { userType } from '../types/userType';
import { userToJSON } from '../helpers/userToJSON';

const resolver = async (_, params, context) => {
  await requireFullAdmin(context);
  const data = await UserModel.findAll({ where: { uuid: { [Op.is]: null } } });
  return data.map((pl) => {
    return { ...userToJSON(pl), folder: getFolder(pl.folderId) };
  });
};

export const admins = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
  resolve: resolver,
};

export const requireFullAdmin = async (context) => {
  //TODO: currently hard coded to folderId 1, do this a better way in future
  await contextPermissions(context, 1, 'Admin');
};
