import { MinimalFolder } from '../../../types';
import { useSetFolder } from '../../hooks/useSetFolder';
import { Menu } from '@mantine/core';
import { CommentIcon, DownloadIcon, FolderIcon } from '../../PicrIcons';
import { useGenerateZip } from '../../hooks/useGenerateZip';
import { TbFolderShare, TbFolderStar } from 'react-icons/tb';
import { useMe } from '../../hooks/useMe';
import { useOpenMoveRenameFolderModal } from '../../atoms/modalAtom';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';

type FolderMenuItemsProps = {
  folder: MinimalFolder;
  showFolderLabel?: boolean;
  showOpenItem?: boolean;
};

export const FolderMenuItems = ({
  folder,
  showOpenItem = true,
}: FolderMenuItemsProps) => {
  const setFolder = useSetFolder();
  const generateZip = useGenerateZip(folder);
  const me = useMe();
  const openMoveModal = useOpenMoveRenameFolderModal();
  const { canView } = useCommentPermissions();

  return (
    <>
      {showOpenItem ? (
        <Menu.Item
          leftSection={<FolderIcon size="20" />}
          key="open"
          onClick={() => {
            setFolder(folder);
          }}
        >
          Open {folder.name}
        </Menu.Item>
      ) : null}
      {me?.isUser ? (
        <Menu.Item
          leftSection={<TbFolderStar size="20" />}
          key="manage"
          onClick={() => {
            setFolder(folder, 'manage/links');
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
        Download ZIP
      </Menu.Item>
      {canView ? (
        <>
          <Menu.Label>Comments & Ratings</Menu.Label>
          <Menu.Item
            leftSection={<CommentIcon />}
            onClick={() => setFolder(folder, 'activity')}
          >
            View Activity
          </Menu.Item>
        </>
      ) : null}
    </>
  );
};

export const FolderMenu = ({ folder }: { folder: MinimalFolder }) => (
  <FolderMenuItems folder={folder} showOpenItem />
);
