import type { PicrFolder } from '@shared/types/picr';
import { useSetFolder } from '../../hooks/useSetFolder';
import { Menu } from '@mantine/core';
import {
  BrandingIcon,
  CommentIcon,
  CsvExportIcon,
  DownloadIcon,
  FilterIcon,
  FolderIcon,
  ManageFolderIcon,
  MoveFolderIcon,
} from '../../PicrIcons';
import { useGenerateZip } from '../../hooks/useGenerateZip';
import { useMe } from '../../hooks/useMe';
import { useOpenMoveRenameFolderModal } from '../../atoms/modalAtom';
import { useCommentPermissions } from '../../hooks/useCommentPermissions';

type FolderMenuItemsProps = {
  folder: PicrFolder;
  showOpenItem?: boolean;
  onFilterFiles?: () => void;
  onCsvExport?: () => void;
  onBranding?: () => void;
};

export const FolderMenuItems = ({
  folder,
  showOpenItem = true,
  onFilterFiles,
  onCsvExport,
  onBranding,
}: FolderMenuItemsProps) => {
  const setFolder = useSetFolder();
  const generateZip = useGenerateZip(folder);
  const me = useMe();
  const openMoveModal = useOpenMoveRenameFolderModal();
  const { canView } = useCommentPermissions();
  const handleGenerateZip = () => {
    void generateZip?.();
  };

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
      {onFilterFiles ? (
        <Menu.Item leftSection={<FilterIcon />} onClick={onFilterFiles}>
          Filter Files
        </Menu.Item>
      ) : null}
      {generateZip ? (
        <Menu.Item
          leftSection={<DownloadIcon />}
          key="download"
          onClick={handleGenerateZip}
        >
          Download ZIP
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
      {me?.isUser ? (
        <>
          <Menu.Divider />
          <Menu.Label>Admin</Menu.Label>
          <Menu.Item
            leftSection={<ManageFolderIcon size="20" />}
            key="manage"
            onClick={() => {
              setFolder(folder, 'manage/links');
            }}
          >
            Manage {folder.name}
          </Menu.Item>
          {me.isAdmin && me.clientInfo.canWrite ? (
            <Menu.Item
              leftSection={<MoveFolderIcon size="20" />}
              key="move"
              onClick={() => openMoveModal(folder)}
            >
              Move/Rename Folder
            </Menu.Item>
          ) : null}
          {onCsvExport ? (
            <Menu.Item
              leftSection={<CsvExportIcon size={20} />}
              onClick={onCsvExport}
            >
              CSV Export
            </Menu.Item>
          ) : null}
          {onBranding ? (
            <Menu.Item
              leftSection={<BrandingIcon size={20} />}
              onClick={onBranding}
            >
              {folder.branding && folder.branding.id !== '0'
                ? 'Edit Branding'
                : 'Add Branding'}
            </Menu.Item>
          ) : null}
        </>
      ) : null}
    </>
  );
};
