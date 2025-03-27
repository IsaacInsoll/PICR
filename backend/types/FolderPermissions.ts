import { FolderFields, UserFields } from '../db/picrDb';

export type FolderPermissions = 'View' | 'Admin' | 'None';

export interface ContextualPermissions {
  permissions: FolderPermissions;
  user: UserFields;
  folder: FolderFields;
}
