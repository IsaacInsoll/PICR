import UserModel from '../db/UserModel';
import FolderModel from '../db/FolderModel';

export type FolderPermissions = 'View' | 'Admin' | 'None';

export interface ContextualPermissions {
  permissions: FolderPermissions;
  user: UserModel | null;
  folder?: FolderModel | null;
}
