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

export const FileInfoModal = ({ file }: { file: PicrFile }) => {
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
      title={file.type + ' Details: ' + fileName}
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
          label="File size"
          value={prettyBytes(file.fileSize ?? 0, { locale: formattingLocale })}
        />
        <StatCard label="File type" value={file.type} />
        <StatCard
          label="File modified"
          value={prettyDate(file.fileLastModified ?? '', formattingLocale)}
        />
        {showFileCreated ? (
          <StatCard
            label="File created"
            value={prettyDate(file.fileCreated ?? '', formattingLocale)}
          />
        ) : null}
      </Group>
      {file.metadata != null ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th colSpan={2}>Metadata</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{MetadataTableRows(file)}</Table.Tbody>
        </Table>
      ) : null}
    </Modal>
  );
};
