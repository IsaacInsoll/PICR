import UserModel from '../db/sequelize/UserModel';
import FolderModel from '../db/sequelize/FolderModel';

export type FolderPermissions = 'View' | 'Admin' | 'None';

export interface ContextualPermissions {
  permissions: FolderPermissions;
  user: UserModel | null;
  folder?: FolderModel | null;
}
