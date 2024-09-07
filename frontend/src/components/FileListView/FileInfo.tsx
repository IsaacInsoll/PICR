import { useMediaQuery } from '@mantine/hooks';
import { Box, Card, Group, Modal, Table, Text } from '@mantine/core';
import { MinimalFile } from '../../../types';

import { metadataIcons } from './metadataIcons';
import prettyBytes from 'pretty-bytes';
import { prettyDate } from './Filtering/PrettyDate';
import { PicrImage } from '../PicrImage';
import { formatMetadataValue } from '../../metadata/formatMetadataValue';
import { MetadataTableRows } from '../../metadata/metadataTableRows';

export const FileInfo = ({
  file,
  onClose,
}: {
  file: MinimalFile;
  onClose: (file: File) => void;
}) => {
  const isMobile = useMediaQuery('(max-width: 50em)');

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
          <PicrImage file={file} size="md" clickable={false} />
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

const StatCard = ({ value, label }: { value: string; label: string }) => {
  return (
    <Card style={{ flexGrow: 1 }}>
      <Text fz="lg" fw={500}>
        {value}
      </Text>
      <Text fz="xs" tt="uppercase" fw={700} c="dimmed">
        {label}
      </Text>
    </Card>
  );
};
