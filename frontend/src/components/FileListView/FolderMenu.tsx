import { MinimalFolder } from '../../../types';
import { useSetFolder } from '../../hooks/useSetFolder';
import { Menu } from '@mantine/core';
import {
  CommentIcon,
  CsvExportIcon,
  DownloadIcon,
  FolderIcon,
  ManageFolderIcon,
  MoveFolderIcon,
} from '../../PicrIcons';
import { useGenerateZip } from '../../hooks/useGenerateZip';
import { useMe } from '../../hooks/useMe';
import { useOpenMoveRenameFolderModal } from '../../atoms/modalAtom';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';

type FolderMenuItemsProps = {
  folder: MinimalFolder;
  showFolderLabel?: boolean;
  showOpenItem?: boolean;
  onCsvExport?: () => void;
};

export const FolderMenuItems = ({
  folder,
  showOpenItem = true,
  onCsvExport,
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
          leftSection={<ManageFolderIcon size="20" />}
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
          leftSection={<MoveFolderIcon size="20" />}
          key="move"
          onClick={() => openMoveModal(folder)}
        >
          Move/Rename Folder
        </Menu.Item>
      ) : null}

      {generateZip ? (
        <Menu.Item
          leftSection={<DownloadIcon />}
          key="download"
          onClick={generateZip}
        >
          Download ZIP
        </Menu.Item>
      ) : null}
      {me?.isUser && onCsvExport ? (
        <Menu.Item
          leftSection={<CsvExportIcon size={20} />}
          onClick={onCsvExport}
        >
          CSV Export
        </Menu.Item>
      ) : null}
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
