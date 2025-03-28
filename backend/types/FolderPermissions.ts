import FolderModel from '../db/sequelize/FolderModel';
import { UserFields } from '../db/picrDb';

export type FolderPermissions = 'View' | 'Admin' | 'None';

export interface ContextualPermissions {
  permissions: FolderPermissions;
  user: UserFields | null;
  folder?: FolderModel | null;
}
