import { contextPermissions } from '../../auth/contextPermissions';
import FileModel from '../../db/FileModel';
import { addToQueue } from '../../filesystem/fileQueue';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql/index';
import { allSubfolderIds } from '../../helpers/allSubfolders';

const resolver = async (_, params, context) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );
  const folderIds = await allSubfolderIds(folder);
  const where = { folderId: folderIds };
  const ids = await FileModel.findAll({ where, attributes: ['id'] });
  ids?.map((id) => addToQueue('generateThumbnails', { id: id.id }));
  return true;
};

export const generateThumbnails = {
  type: new GraphQLNonNull(GraphQLBoolean),
  resolve: resolver,
  args: {
    folderId: { type: GraphQLID },
  },
};
