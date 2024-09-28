import File from '../../models/File';
import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';

import { fileToJSON } from '../helpers/fileToJSON';
import { GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { fileInterface } from '../interfaces/fileInterface';
import { commentType } from '../types/commentType';
import Comment from '../../models/Comment';

const resolver = async (_, params, context) => {
  const file = await File.findByPk(params.fileId);
  const [p, u] = await contextPermissionsForFolder(
    context,
    file.folderId,
    true,
  );
  const list = await Comment.findAll({ where: { fileId: file.id } });
  // return comments;
  return list.map((x) => {
    console.log(x);
    return { ...x.toJSON(), timestamp: x.createdAt };
  });
};

export const comments = {
  type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(commentType))),
  resolve: resolver,
  args: { fileId: { type: new GraphQLNonNull(GraphQLID) } },
};
