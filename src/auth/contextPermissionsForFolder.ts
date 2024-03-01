import { CustomJwtPayload } from '../types/CustomJwtPayload';
import PublicLink from '../models/PublicLink';
import { doAuthError } from './doAuthError';
import { getUserFromToken } from './jwt-auth';
import { FolderPermissions } from '../types/FolderPermissions';
import Folder from '../models/Folder';

export const contextPermissionsForFolder = async (
  context: CustomJwtPayload,
  folderId?: number,
): Promise<FolderPermissions> => {
  //TODO: do more than merely check a userId exists, perhaps permissions
  const user = await getUserFromToken(context);
  if (context.uuid && context.uuid !== '') {
    const link = await PublicLink.findOne({ where: { uuid: context.uuid } });
    //todo: check expiry dates, enabled status on link
    const folder = await Folder.findByPk(folderId);
    if (link) {
      const tree = await FolderIsUnderFolder(
        folder,
        await Folder.findByPk(link.folderId),
      );
      if (tree) {
        return user ? 'Admin' : 'View';
      }
      return 'None';
    }
  }
  return user ? 'Admin' : 'None'; // TODO: don't presume users can see everything
};

export const FolderIsUnderFolder = async (
  child: Folder,
  parent: Folder,
): Promise<boolean> => {
  console.log('FUF ', child.id, ' under ', parent.id);
  if (!child && !parent) return false;
  if (child.id === parent.id) return true;
  if (!child.parentId) return false;
  const childParent = await Folder.findByPk(child.parentId);
  return childParent ? FolderIsUnderFolder(childParent, parent) : false;
};
