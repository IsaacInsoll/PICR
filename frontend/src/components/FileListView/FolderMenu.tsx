import type { PicrFolder } from '@shared/types/picr';
import { normalizeDisplayName } from '@shared/displayName';
import { useFolderLink } from '../../hooks/useSetFolder';
import { PicrMenuItem } from '../PicrLink';
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
  const folderName = normalizeDisplayName(folder.name);
  const openLink = useFolderLink(folder);
  const activityLink = useFolderLink(folder, 'activity');
  const manageLink = useFolderLink(folder, 'manage/links');
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
        <PicrMenuItem
          leftSection={<FolderIcon size="20" />}
          key="open"
          to={openLink.to}
        >
          Open {folderName}
        </PicrMenuItem>
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
          <PicrMenuItem leftSection={<CommentIcon />} to={activityLink.to}>
            View Activity
          </PicrMenuItem>
        </>
      ) : null}
      {me?.isUser ? (
        <>
          <Menu.Divider />
          <Menu.Label>Admin</Menu.Label>
          <PicrMenuItem
            leftSection={<ManageFolderIcon size="20" />}
            key="manage"
            to={manageLink.to}
          >
            Manage {folderName}
          </PicrMenuItem>
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
