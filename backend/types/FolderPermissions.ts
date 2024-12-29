import User from '../models/User';
import Folder from '../models/Folder';

export type FolderPermissions = 'View' | 'Admin' | 'None';

export interface ContextualPermissions {
  permissions: FolderPermissions;
  user: User | null;
  folder?: Folder | null;
}
