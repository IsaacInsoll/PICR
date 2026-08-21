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
  const { t } = useTranslation(['gallery', 'admin']);
  const formatFolderName = useFolderNameFormatter();
  const folderName = formatFolderName(folder);
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
          {t('folder.open', { name: folderName })}
        </PicrMenuItem>
      ) : null}
      {onFilterFiles ? (
        <Menu.Item leftSection={<FilterIcon />} onClick={onFilterFiles}>
          {t('folder.filterFiles')}
        </Menu.Item>
      ) : null}
      {generateZip ? (
        <Menu.Item
          leftSection={<DownloadIcon />}
          key="download"
          onClick={handleGenerateZip}
        >
          {t('folder.downloadZip')}
        </Menu.Item>
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
          <Menu.Divider />
          <Menu.Label>{t('folder.admin', { ns: 'admin' })}</Menu.Label>
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
