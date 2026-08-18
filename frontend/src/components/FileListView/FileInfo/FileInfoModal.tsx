import { Box, Group, Modal, Table } from '@mantine/core';
import { normalizeDisplayName } from '@shared/displayName';
import { MetadataTableRows } from './metadataTableRows';
import { useIsSmallScreen } from '../../../hooks/useIsMobile';
import { StatCard } from './StatCard';
import { useSetAtom } from 'jotai';
import { closeModalAtom } from '../../../atoms/modalAtom';
import { FilePreview } from '../FilePreview';
import { prettyBytes } from '@shared/prettyBytes';
import { isUnavailableFileCreatedDate, prettyDate } from '@shared/prettyDate';
import type { PicrFile } from '@shared/types/picr';
import { useLanguage } from '../../../i18n/useLanguage';
import { useTranslation } from 'react-i18next';
import { fileTypeLabel } from '../../../i18n/galleryLabels';

export const FileInfoModal = ({ file }: { file: PicrFile }) => {
  const { t } = useTranslation('gallery');
  const onClose = useSetAtom(closeModalAtom);
  const isMobile = useIsSmallScreen();
  const { formattingLocale } = useLanguage();
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
      {file.type === 'Image' || file.type === 'Video' ? (
        <Box mb={16}>
          {/*<PicrImage file={file} size="md" clickable={false} />*/}
          <FilePreview file={file} />
        </Box>
      ) : null}
      <Group style={{ width: '100%' }}>
        <StatCard
          label={t('file.size')}
          value={prettyBytes(file.fileSize ?? 0, { locale: formattingLocale })}
        />
        <StatCard label={t('file.type')} value={fileTypeLabel(file.type, t)} />
        <StatCard
          label={t('file.modified')}
          value={prettyDate(file.fileLastModified ?? '', formattingLocale)}
        />
        {showFileCreated ? (
          <StatCard
            label={t('file.created')}
            value={prettyDate(file.fileCreated ?? '', formattingLocale)}
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
          <Table.Tbody>{MetadataTableRows(file)}</Table.Tbody>
        </Table>
      ) : null}
    </Modal>
  );
};
