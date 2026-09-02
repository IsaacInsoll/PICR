import { Group, Modal, Stack, Table } from '@mantine/core';
import { normalizeDisplayName } from '@shared/displayName';
import { MetadataTableRows } from './metadataTableRows';
import { useIsSmallScreen } from '../../../hooks/useIsMobile';
import { StatCard } from './StatCard';
import { prettyBytes } from '@shared/prettyBytes';
import { isUnavailableFileCreatedDate } from '@shared/prettyDate';
import type { PicrFile, PicrFolder } from '@shared/types/picr';
import { useTranslation } from 'react-i18next';
import { fileTypeLabel } from '../../../i18n/galleryLabels';
import { useDateFormatters } from '../../../i18n/useDateFormatters';
import { FileModalFileContext } from '../FileModalFileContext';
import { useCloseFileModal } from '../../../hooks/useFileModalNavigation';

export const FileInfoModal = ({
  file,
  folder,
}: {
  file: PicrFile;
  folder?: PicrFolder;
}) => {
  const { t } = useTranslation('gallery');
  const onClose = useCloseFileModal();
  const isMobile = useIsSmallScreen();
  const { formattingLocale, prettyDate } = useDateFormatters();
  const fileName = normalizeDisplayName(file.name);
  const showFileCreated =
    !!file.fileCreated && !isUnavailableFileCreatedDate(file.fileCreated);

  return (
    <Modal
      opened={true}
      centered={true}
      onClose={onClose}
      title={t('file.detailsTitle', {
        type: fileTypeLabel(file.type, t),
        name: fileName,
      })}
      fullScreen={isMobile}
      overlayProps={{ blur: 3 }}
      // transitionProps={{ transition: 'fade', duration: 200 }}
    >
      <Stack>
        <FileModalFileContext
          file={file}
          folder={folder}
          showPreview={file.type === 'Image' || file.type === 'Video'}
        />
        <Group style={{ width: '100%' }}>
          <StatCard
            label={t('file.size')}
            value={prettyBytes(file.fileSize ?? 0, {
              locale: formattingLocale,
            })}
          />
          <StatCard
            label={t('file.type')}
            value={fileTypeLabel(file.type, t)}
          />
          <StatCard
            label={t('file.modified')}
            value={prettyDate(file.fileLastModified ?? '')}
          />
          {showFileCreated ? (
            <StatCard
              label={t('file.created')}
              value={prettyDate(file.fileCreated ?? '')}
            />
          ) : null}
        </Group>
        {file.metadata != null ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th colSpan={2}>{t('file.metadata')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <MetadataTableRows file={file} />
            </Table.Tbody>
          </Table>
        ) : null}
      </Stack>
    </Modal>
  );
};
