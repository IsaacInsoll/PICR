import { PicrDrawer } from './PicrDrawer';
import { ManageFolder } from '../pages/ManageFolder';
import type { PicrFolder } from '@shared/types/picr';
import { Center } from '@mantine/core';
import { LoadingIndicator } from './LoadingIndicator';

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

export const ManageFolderDrawerLoading = ({
  folderName,
  onClose,
}: {
  folderName: string;
  onClose: () => void;
}) => (
  <PicrDrawer title={`Manage: ${folderName}`} onClose={onClose}>
    <Center py="xl">
      <LoadingIndicator />
    </Center>
  </PicrDrawer>
);
