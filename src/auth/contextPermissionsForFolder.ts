import { CustomJwtPayload } from '../types/CustomJwtPayload';
import PublicLink from '../models/PublicLink';
import { getUserFromToken } from './jwt-auth';
import { FolderPermissions } from '../types/FolderPermissions';
import Folder from '../models/Folder';
import { FolderIsUnderFolder } from './folderIsUnderFolder';
import { doAuthError } from './doAuthError';
import { GraphQLError } from 'graphql/error';

export const contextPermissionsForFolder = async (
  context: CustomJwtPayload,
  folderId?: number,
  throwErrorIfNoPermission: boolean = false,
): Promise<FolderPermissions> => {
  const user = await getUserFromToken(context);
  const hasUUID = !!context.uuid && context.uuid !== '';

  if (user) {
    //todo: more granular permissions rather than, 'all users are full admins of everything'
    return 'Admin';
  }

  if (hasUUID) {
    const link = await PublicLink.findOne({ where: { uuid: context.uuid } });
    //todo: check expiry dates, enabled status on link
    const folder = await Folder.findByPk(folderId);
    if (link) {
      const linkedFolder = await Folder.findByPk(link.folderId);
      const tree = await FolderIsUnderFolder(folder, linkedFolder);
      if (tree) {
        return 'View';
      }
    }
  }
  if (throwErrorIfNoPermission) {
    if (hasUUID) {
      throw new GraphQLError('Invalid Link (UUID)');
    } else {
      doAuthError('Access Denied');
    }
  }
  return 'None';
};
