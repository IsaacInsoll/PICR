import { MinimalFolder } from '../../../types';
import { useSetFolder } from '../../hooks/useSetFolder';
import { Menu } from '@mantine/core';
import { DownloadIcon, FolderIcon } from '../../PicrIcons';
import { useGenerateZip } from '../../hooks/useGenerateZip';
import { TbFolderShare, TbFolderStar } from 'react-icons/tb';
import { useMe } from '../../hooks/useMe';
import { useOpenMoveRenameFolderModal } from '../../atoms/modalAtom';

export const FolderMenu = ({ folder }: { folder: MinimalFolder }) => {
  const setFolder = useSetFolder();
  const generateZip = useGenerateZip(folder);
  const me = useMe();
  const openMoveModal = useOpenMoveRenameFolderModal();

  return (
    <>
      <Menu.Item
        leftSection={<FolderIcon size="20" />}
        key="open"
        onClick={() => {
          setFolder(folder);
        }}
      >
        Open {folder.name}
      </Menu.Item>
      {me?.isUser ? (
        <Menu.Item
          leftSection={<TbFolderStar size="20" />}
          key="manage"
          onClick={() => {
            setFolder(folder, 'manage');
          }}
        >
          Manage {folder.name}
        </Menu.Item>
      ) : null}
      {me?.isAdmin && me.clientInfo.canWrite ? (
        <Menu.Item
          leftSection={<TbFolderShare size="20" />}
          key="move"
          onClick={() => openMoveModal(folder)}
        >
          Move/Rename Folder
        </Menu.Item>
      ) : null}
      <Menu.Item
        leftSection={<DownloadIcon />}
        key="download"
        onClick={generateZip}
      >
        Download
      </Menu.Item>
    </>
  );
};
