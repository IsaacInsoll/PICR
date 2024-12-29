import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLError } from 'graphql/error';
import Folder from '../../models/Folder';
import { Op } from 'sequelize';
import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';
import { allSubFoldersRecursive } from '../../helpers/allSubFoldersRecursive';
import AccessLogModel from '../../models/AccessLogModel';
import { accessLogType } from '../types/accessLogType';

const resolver = async (_, params, context) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );

  const ids = [folder.id];

  if (params.includeChildren) {
    const children = await allSubFoldersRecursive(folder.id);
    const childIds = children.map(({ id }) => id);
    ids.push(...childIds);
  }

  const data = await AccessLogModel.findAll({
    where: {
      folderId: { [Op.or]: ids },
      ...(params.userId ? { userId: params.userId } : {}),
    },
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
  return data.map((al) => {
    return { ...al.toJSON(), timestamp: al.createdAt };
  });
};

export const accessLogs = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(accessLogType))),
  resolve: resolver,
  args: {
    folderId: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: GraphQLID },
    includeChildren: { type: GraphQLBoolean },
  },
};
