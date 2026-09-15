import type { PicrFolder } from '@shared/types/picr';
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
import { useTranslation } from 'react-i18next';
import { useFolderNameFormatter } from '../../i18n/useFolderNameFormatter';
import type { MediaResultsSelectionInput } from '@shared/gql/graphql';

type FolderMenuItemsProps = {
  folder: PicrFolder;
  showOpenItem?: boolean;
  onFilterFiles?: () => void;
  onCsvExport?: () => void;
  onBranding?: () => void;
  showManageItem?: boolean;
  showDownloadItem?: boolean;
  downloadSelection?: MediaResultsSelectionInput;
  downloadSelectionCount?: number;
  downloadSelectionUnavailableReason?: string;
};

export const FolderMenuItems = ({
  folder,
  showOpenItem = true,
  onFilterFiles,
  onCsvExport,
  onBranding,
  showManageItem = true,
  showDownloadItem = true,
  downloadSelection,
  downloadSelectionCount,
  downloadSelectionUnavailableReason,
}: FolderMenuItemsProps) => {
  const { t } = useTranslation(['gallery', 'admin']);
  const formatFolderName = useFolderNameFormatter();
  const folderName = formatFolderName(folder);
  const openLink = useFolderLink(folder, undefined, 'carry-gallery');
  const activityLink = useFolderLink(folder, 'activity');
  const manageLink = useFolderLink(folder, 'manage/folder');
  const generateZip = useGenerateZip(folder);
  const generateSelectionZip = useGenerateZip(
    folder,
    undefined,
    downloadSelection,
    downloadSelectionCount,
  );
  const me = useMe();
  const openMoveModal = useOpenMoveRenameFolderModal();
  const { canView } = useCommentPermissions();
  const handleGenerateZip = () => {
    void generateZip?.();
  };
  const handleGenerateSelectionZip = () => {
    void generateSelectionZip?.();
  };
  const hasItemsBeforeAdmin =
    showOpenItem || !!onFilterFiles || !!generateZip || canView;

  return (
    <>
      {showOpenItem ? (
        <PicrMenuItem
          leftSection={<FolderIcon size="20" />}
          key="open"
          to={openLink.to}
        >
          {t('folder.open', { name: folderName })}
        </PicrMenuItem>
      ) : null}
      {onFilterFiles ? (
        <Menu.Item leftSection={<FilterIcon />} onClick={onFilterFiles}>
          {t('folder.filterFiles')}
        </Menu.Item>
      ) : null}
      {generateZip && showDownloadItem ? (
        downloadSelectionCount === undefined ? (
          <Menu.Item
            leftSection={<DownloadIcon />}
            key="download"
            onClick={handleGenerateZip}
          >
            {t('folder.downloadZip')}
          </Menu.Item>
        ) : (
          <>
            <Menu.Item
              leftSection={<DownloadIcon />}
              key="download-selection"
              onClick={handleGenerateSelectionZip}
              disabled={!downloadSelection || downloadSelectionCount === 0}
            >
              {t('download.shown', { count: downloadSelectionCount })}
            </Menu.Item>
            {downloadSelectionUnavailableReason ? (
              <Menu.Label maw={280}>
                {downloadSelectionUnavailableReason}
              </Menu.Label>
            ) : null}
            <Menu.Item
              leftSection={<FolderIcon />}
              key="download-folder"
              onClick={handleGenerateZip}
            >
              {t('download.entireFolder', { folder: folderName })}
            </Menu.Item>
          </>
        )
      ) : null}
      {canView ? (
        <>
          <Menu.Label>{t('folder.commentsAndRatings')}</Menu.Label>
          <PicrMenuItem leftSection={<CommentIcon />} to={activityLink.to}>
            {t('folder.viewActivity')}
          </PicrMenuItem>
        </>
      ) : null}
      {me?.isUser ? (
        <>
          {hasItemsBeforeAdmin ? <Menu.Divider /> : null}
          <Menu.Label>{t('folder.admin', { ns: 'admin' })}</Menu.Label>
          {showManageItem ? (
            <PicrMenuItem
              leftSection={<ManageFolderIcon size="20" />}
              key="manage"
              to={manageLink.to}
            >
              {t('folder.manageNamed', {
                ns: 'admin',
                folder: folderName,
              })}
            </PicrMenuItem>
          ) : null}
          {me.isAdmin && me.clientInfo.canWrite ? (
            <Menu.Item
              leftSection={<MoveFolderIcon size="20" />}
              key="move"
              onClick={() => openMoveModal(folder)}
            >
              {t('folder.moveRename.action', { ns: 'admin' })}
            </Menu.Item>
          ) : null}
          {onCsvExport ? (
            <Menu.Item
              leftSection={<CsvExportIcon size={20} />}
              onClick={onCsvExport}
            >
              {t('folder.csv.action', { ns: 'admin' })}
            </Menu.Item>
          ) : null}
          {onBranding ? (
            <Menu.Item
              leftSection={<BrandingIcon size={20} />}
              onClick={onBranding}
            >
              {folder.branding && folder.branding.id !== '0'
                ? t('folder.branding.edit', { ns: 'admin' })
                : t('folder.branding.add', { ns: 'admin' })}
            </Menu.Item>
          ) : null}
        </>
      ) : null}
    </>
  );
};
