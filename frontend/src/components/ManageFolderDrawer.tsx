import { PicrDrawer } from './PicrDrawer';
import { ManageFolder } from '../pages/ManageFolder';
import type { PicrFolder } from '@shared/types/picr';

export const ManageFolderDrawer = ({
  folder,
  onClose,
}: {
  folder: PicrFolder;
  onClose: () => void;
}) => (
  <PicrDrawer title={`Manage: ${folder.name}`} onClose={onClose}>
    <ManageFolder folder={folder} />
  </PicrDrawer>
);
