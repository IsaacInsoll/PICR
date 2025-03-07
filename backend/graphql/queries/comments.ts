import FileModel from '../../db/FileModel';
import { contextPermissions } from '../../auth/contextPermissions';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { commentType } from '../types/commentType';
import CommentModel from '../../db/CommentModel';
import { GraphQLError } from 'graphql/error';
import { subFilesMap } from '../helpers/subFiles';
import { Order } from 'sequelize';
import { addUserRelationship } from '../helpers/addUserRelationship';

const resolver = async (_, params, context) => {
  //TODO: maybe support subfolders?
  //TODO: pagination?
  if (!params.fileId && !params.folderId) {
    throw new GraphQLError('Must specify either fileId or folderId');
  }
  //presume file, otherwise try folder
  const order: Order = [['createdAt', 'DESC']];

  if (params.fileId) {
    const file = await FileModel.findByPk(params.fileId);
    await contextPermissions(context, file.folderId, 'View');
    const list = await CommentModel.findAll({
      where: { fileId: file.id },
      order,
    });
    return addUserRelationship(
      list.map((x) => {
        return {
          ...x.toJSON(),
          timestamp: x.createdAt,
          file: file.toJSON(),
        };
      }),
    );
  } else {
    const folderId = params.folderId;
    await contextPermissions(context, folderId, 'View');
    const files = await subFilesMap(folderId);
    const list = await CommentModel.findAll({ where: { folderId }, order });
    return addUserRelationship(
      list.map((x) => {
        return {
          ...x.toJSON(),
          timestamp: x.createdAt,
          file: files[x.fileId],
        };
      }),
    );
  }
};

export const comments = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(commentType))),
  resolve: resolver,
  args: { fileId: { type: GraphQLID }, folderId: { type: GraphQLID } },
};
