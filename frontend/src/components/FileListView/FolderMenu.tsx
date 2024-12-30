import { MinimalFolder } from '../../../types';
import { useSetFolder } from '../../hooks/useSetFolder';
import { Menu } from '@mantine/core';
import { DownloadIcon, FolderIcon } from '../../PicrIcons';
import { useGenerateZip } from '../../hooks/useGenerateZip';

export const FolderMenu = ({ folder }: { folder: MinimalFolder }) => {
  const setFolder = useSetFolder();
  const generateZip = useGenerateZip(folder);

  //TODO: Manage

  return (
    <>
      <Menu.Item
        leftSection={<FolderIcon size="20" />}
        key={1}
        onClick={() => {
          setFolder(folder);
        }}
      >
        Open {folder.name}
      </Menu.Item>
      <Menu.Item leftSection={<DownloadIcon />} key={4} onClick={generateZip}>
        Download
      </Menu.Item>
    </>
  );
};
