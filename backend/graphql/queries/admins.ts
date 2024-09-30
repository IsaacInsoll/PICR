import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { GraphQLError } from 'graphql/error';
import User from '../../models/User';
import { Op } from 'sequelize';
import { getFolder } from '../helpers/getFolder';
import { GraphQLList, GraphQLNonNull } from 'graphql/index';
import { userType } from '../types/userType';

const resolver = async (_, params, context) => {
  // TODO: not hardcode 'full admin' to 'admin on folder 1'
  const [p, u] = await contextPermissionsForFolder(context, 1, true);
  if (p !== 'Admin') throw new GraphQLError('You must be an Admin to see this');
  const data = await User.findAll({ where: { uuid: { [Op.is]: null } } });
  return data.map((pl) => {
    return { ...pl.toJSON(), folder: getFolder(pl.folderId) };
  });
};

export const admins = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(userType))),
  resolve: resolver,
};
