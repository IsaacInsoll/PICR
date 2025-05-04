import { MinimalFolder } from '../../../types';
import { useSetFolder } from '../../hooks/useSetFolder';
import { Menu } from '@mantine/core';
import { DownloadIcon, FolderIcon } from '../../PicrIcons';
import { useGenerateZip } from '../../hooks/useGenerateZip';
import { TbFolderStar } from 'react-icons/tb';
import { useMe } from '../../hooks/useMe';

export const FolderMenu = ({ folder }: { folder: MinimalFolder }) => {
  const setFolder = useSetFolder();
  const generateZip = useGenerateZip(folder);
  const me = useMe();

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
      {me?.isUser ? (
        <Menu.Item
          leftSection={<TbFolderStar size="20" />}
          key={1}
          onClick={() => {
            setFolder(folder, 'manage');
          }}
        >
          Manage {folder.name}
        </Menu.Item>
      ) : null}
      <Menu.Item leftSection={<DownloadIcon />} key={4} onClick={generateZip}>
        Download
      </Menu.Item>
    </>
  );
};
