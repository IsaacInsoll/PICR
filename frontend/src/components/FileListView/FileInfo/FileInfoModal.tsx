import { Box, Group, Modal, Table } from '@mantine/core';
import { MinimalFile } from '../../../../types';
import prettyBytes from 'pretty-bytes';
import { prettyDate } from '../Filtering/PrettyDate';
import { PicrImage } from '../../PicrImage';
import { MetadataTableRows } from './metadataTableRows';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { PicrModal } from '../../PicrModal';
import { StatCard } from './StatCard';
import { useAtomValue, useSetAtom } from 'jotai/index';
import { closeModalAtom, modalAtom } from '../../../atoms/modalAtom';
import { GalleryImage } from '../GridGallery';
import { FilePreview } from '../FilePreview';

export const FileInfoModal = () => {
  const { file, open } = useAtomValue(modalAtom);
  const onClose = useSetAtom(closeModalAtom);
  const isMobile = useIsMobile();

  return (
    <Modal
      opened={open}
      centered={true}
      onClose={onClose}
      title={file.type + ' Details: ' + file.name}
      fullScreen={isMobile}
      overlayProps={{ blur: 3 }}
      // transitionProps={{ transition: 'fade', duration: 200 }}
    >
      {file.type == 'Image' || file.type == 'Video' ? (
        <Box mb={16}>
          {/*<PicrImage file={file} size="md" clickable={false} />*/}
          <FilePreview file={file} />
        </Box>
      ) : null}
      <Group style={{ width: '100%' }}>
        <StatCard label="File size" value={prettyBytes(file.fileSize)} />
        <StatCard label="File type" value={file.type} />
        <StatCard
          label="Last modified"
          value={prettyDate(file.fileLastModified)}
        />
      </Group>
      {file.metadata ? (
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
