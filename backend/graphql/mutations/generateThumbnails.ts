import { contextPermissions } from '../../auth/contextPermissions';
import { AllChildFolderIds } from '../../auth/folderUtils';
import File from '../../models/File';
import { addToQueue } from '../../filesystem/fileQueue';
import { GraphQLBoolean, GraphQLID, GraphQLNonNull } from 'graphql/index';

const resolver = async (_, params, context) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );
  const folderIds = await AllChildFolderIds(folder);
  const where = { folderId: folderIds };
  const ids = await File.findAll({ where, attributes: ['id'] });
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
