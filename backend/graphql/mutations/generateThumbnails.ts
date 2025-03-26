import { contextPermissionsForFolder as perms } from '../../auth/contextPermissionsForFolder';
import { doAuthError } from '../../auth/doAuthError';
import { AllChildFolderIds } from '../../helpers/folderUtils';
import File from '../../models/File';
import { addToQueue } from '../../filesystem/fileQueue';
import Folder from '../../models/Folder';
import {
  GraphQLBoolean,
  GraphQLField,
  GraphQLID,
  GraphQLNonNull,
} from 'graphql/index';
import { GraphQLFieldResolver } from 'graphql/type';
import { DBFolderForId } from '../../db/picrDb';

const resolver = async (_, params, context) => {
  const { folder } = await contextPermissions(
    context,
    params.folderId,
    'Admin',
  );
  const folderIds = await AllChildFolderIds(folder);
  const where = { folderId: folderIds };
  const ids = await FileModel.findAll({ where, attributes: ['id'] });
  // console.log(ids);
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
