import { useMediaQuery } from '@mantine/hooks';
import { Box, Card, Group, Modal, Table, Text } from '@mantine/core';
import { MinimalFile } from '../../../types';

import { metadataIcons } from './metadataIcons';
import { formatValue } from './Filtering/MetadataBox';
import prettyBytes from 'pretty-bytes';
import { prettyDate } from './Filtering/PrettyDate';
import { PicrImage } from '../PicrImage';

export const FileInfo = ({
  file,
  onClose,
}: {
  file: MinimalFile;
  onClose: (file: File) => void;
}) => {
  const isMobile = useMediaQuery('(max-width: 50em)');

  console.log('fileinfo', file.name);

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
          <PicrImage file={file} size="md" />
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
          <Table.Tbody>
            {Object.keys(file.metadata).map((k) => (
              <Table.Tr key={k}>
                <Table.Td>{metadataIcons[k]}</Table.Td>
                <Table.Td>{k}</Table.Td>
                <Table.Td>
                  {file.metadata && file.metadata[k]
                    ? formatValue(k, file.metadata[k]).label
                    : ''}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
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
