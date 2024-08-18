import { useMediaQuery } from '@mantine/hooks';
import { Modal, Table } from '@mantine/core';
import { MinimalFile } from '../../../types';

import { metadataIcons } from './metadataIcons';
import { formatValue } from './Filtering/MetadataBox';

export const FileInfo = ({
  file,
  onClose,
}: {
  file: MinimalFile;
  onClose: (file: File) => void;
}) => {
  console.log(file);
  const isMobile = useMediaQuery('(max-width: 50em)');

  return (
    <>
      <Modal
        opened={true}
        onClose={onClose}
        title={file.name}
        fullScreen={isMobile}
        // transitionProps={{ transition: 'fade', duration: 200 }}
      >
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
                <Table.Td>{formatValue(k, file.metadata[k]).label}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Modal>
    </>
  );
};
