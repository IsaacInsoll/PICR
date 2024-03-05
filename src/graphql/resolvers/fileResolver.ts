import File from '../../models/File';
import { contextPermissionsForFolder } from '../../auth/contextPermissionsForFolder';
import { fileToJSON } from './resolverHelpers';

export const fileResolver = async (params, context) => {
  const file = await File.findByPk(params.id);
  const permissions = await contextPermissionsForFolder(
    context,
    file.folderId,
    true,
  );
  return fileToJSON(file);
};
