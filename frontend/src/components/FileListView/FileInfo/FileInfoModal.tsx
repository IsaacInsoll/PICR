import { Box, Group, Modal, Table } from '@mantine/core';
import { MetadataTableRows } from './metadataTableRows';
import { useIsSmallScreen } from '../../../hooks/useIsMobile';
import { StatCard } from './StatCard';
import { useSetAtom } from 'jotai';
import { closeModalAtom } from '../../../atoms/modalAtom';
import { FilePreview } from '../FilePreview';
import { prettyBytes } from '@shared/prettyBytes';
import { prettyDate } from '@shared/prettyDate';
import { PicrFile } from '../../../../types';

export const FileInfoModal = ({ file }: { file: PicrFile }) => {
  const onClose = useSetAtom(closeModalAtom);
  const isMobile = useIsSmallScreen();

  return (
    <Modal
      opened={true}
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
        <StatCard label="File size" value={prettyBytes(file.fileSize ?? 0)} />
        <StatCard label="File type" value={file.type} />
        <StatCard
          label="Last modified"
          value={prettyDate(file.fileLastModified ?? '')}
        />
        <StatCard label="Created" value={prettyDate(file.fileCreated ?? '')} />
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
